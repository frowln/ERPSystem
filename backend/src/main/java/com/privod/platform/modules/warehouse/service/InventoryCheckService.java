package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.InventoryCheck;
import com.privod.platform.modules.warehouse.domain.InventoryCheckLine;
import com.privod.platform.modules.warehouse.domain.InventoryCheckStatus;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.repository.InventoryCheckLineRepository;
import com.privod.platform.modules.warehouse.repository.InventoryCheckRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementLineRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateInventoryCheckRequest;
import com.privod.platform.modules.warehouse.web.dto.InventoryCheckLineResponse;
import com.privod.platform.modules.warehouse.web.dto.InventoryCheckResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateInventoryCheckLineRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryCheckService {

    private final InventoryCheckRepository checkRepository;
    private final InventoryCheckLineRepository checkLineRepository;
    private final StockEntryRepository stockEntryRepository;
    private final StockMovementRepository movementRepository;
    private final StockMovementLineRepository movementLineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InventoryCheckResponse> listChecks(InventoryCheckStatus status, UUID locationId, Pageable pageable) {
        Specification<InventoryCheck> spec = Specification
                .where(InventoryCheckSpecification.notDeleted())
                .and(InventoryCheckSpecification.hasStatus(status))
                .and(InventoryCheckSpecification.hasLocation(locationId));

        return checkRepository.findAll(spec, pageable)
                .map(check -> {
                    List<InventoryCheckLineResponse> lines = getCheckLines(check.getId());
                    return InventoryCheckResponse.fromEntity(check, lines);
                });
    }

    @Transactional(readOnly = true)
    public InventoryCheckResponse getCheck(UUID id) {
        InventoryCheck check = getCheckOrThrow(id);
        List<InventoryCheckLineResponse> lines = getCheckLines(id);
        return InventoryCheckResponse.fromEntity(check, lines);
    }

    @Transactional(readOnly = true)
    public List<InventoryCheckLineResponse> getCheckLines(UUID checkId) {
        return checkLineRepository.findByCheckIdAndDeletedFalse(checkId)
                .stream()
                .map(InventoryCheckLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public InventoryCheckResponse createCheck(CreateInventoryCheckRequest request) {
        String name = generateCheckName();

        InventoryCheck check = InventoryCheck.builder()
                .name(name)
                .checkDate(request.checkDate())
                .locationId(request.locationId())
                .projectId(request.projectId())
                .status(InventoryCheckStatus.PLANNED)
                .responsibleId(request.responsibleId())
                .responsibleName(request.responsibleName())
                .notes(request.notes())
                .build();

        check = checkRepository.save(check);
        auditService.logCreate("InventoryCheck", check.getId());

        log.info("Inventory check created: {} ({})", check.getName(), check.getId());
        return InventoryCheckResponse.fromEntity(check, List.of());
    }

    @Transactional
    public InventoryCheckResponse startCheck(UUID id) {
        InventoryCheck check = getCheckOrThrow(id);

        if (check.getStatus() != InventoryCheckStatus.PLANNED) {
            throw new IllegalStateException("Начать инвентаризацию можно только из статуса Запланирована");
        }

        // Populate expected quantities from current stock
        List<StockEntry> stockEntries = stockEntryRepository.findByLocationIdAndDeletedFalse(check.getLocationId());

        for (StockEntry entry : stockEntries) {
            InventoryCheckLine line = InventoryCheckLine.builder()
                    .checkId(check.getId())
                    .materialId(entry.getMaterialId())
                    .materialName(entry.getMaterialName())
                    .expectedQuantity(entry.getQuantity())
                    .actualQuantity(BigDecimal.ZERO)
                    .variance(BigDecimal.ZERO.subtract(entry.getQuantity()))
                    .build();
            checkLineRepository.save(line);
        }

        InventoryCheckStatus oldStatus = check.getStatus();
        check.setStatus(InventoryCheckStatus.IN_PROGRESS);
        check = checkRepository.save(check);
        auditService.logStatusChange("InventoryCheck", check.getId(), oldStatus.name(), InventoryCheckStatus.IN_PROGRESS.name());

        log.info("Inventory check started: {} ({}) - {} lines populated",
                check.getName(), check.getId(), stockEntries.size());
        List<InventoryCheckLineResponse> lines = getCheckLines(id);
        return InventoryCheckResponse.fromEntity(check, lines);
    }

    @Transactional
    public InventoryCheckLineResponse updateCheckLine(UUID checkId, UpdateInventoryCheckLineRequest request) {
        InventoryCheck check = getCheckOrThrow(checkId);

        if (check.getStatus() != InventoryCheckStatus.IN_PROGRESS) {
            throw new IllegalStateException("Редактирование строк возможно только в статусе В процессе");
        }

        InventoryCheckLine line = checkLineRepository.findById(request.lineId())
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка инвентаризации не найдена: " + request.lineId()));

        line.setActualQuantity(request.actualQuantity());
        line.setVariance(request.actualQuantity().subtract(
                line.getExpectedQuantity() != null ? line.getExpectedQuantity() : BigDecimal.ZERO));
        if (request.notes() != null) {
            line.setNotes(request.notes());
        }

        line = checkLineRepository.save(line);
        return InventoryCheckLineResponse.fromEntity(line);
    }

    @Transactional
    public InventoryCheckResponse completeCheck(UUID id) {
        InventoryCheck check = getCheckOrThrow(id);

        if (check.getStatus() != InventoryCheckStatus.IN_PROGRESS) {
            throw new IllegalStateException("Завершить инвентаризацию можно только из статуса В процессе");
        }

        List<InventoryCheckLine> lines = checkLineRepository.findByCheckIdAndDeletedFalse(id);

        // Create adjustment movements for variances
        List<InventoryCheckLine> linesWithVariance = lines.stream()
                .filter(line -> line.getVariance() != null && line.getVariance().compareTo(BigDecimal.ZERO) != 0)
                .toList();

        if (!linesWithVariance.isEmpty()) {
            StockMovement adjustmentMovement = StockMovement.builder()
                    .number(generateAdjustmentNumber())
                    .movementDate(LocalDate.now())
                    .movementType(StockMovementType.ADJUSTMENT)
                    .status(StockMovementStatus.DONE)
                    .projectId(check.getProjectId())
                    .destinationLocationId(check.getLocationId())
                    .responsibleId(check.getResponsibleId())
                    .responsibleName(check.getResponsibleName())
                    .notes("Корректировка по результатам инвентаризации: " + check.getName())
                    .build();
            adjustmentMovement = movementRepository.save(adjustmentMovement);

            int seq = 0;
            for (InventoryCheckLine checkLine : linesWithVariance) {
                StockMovementLine movementLine = StockMovementLine.builder()
                        .movementId(adjustmentMovement.getId())
                        .materialId(checkLine.getMaterialId())
                        .materialName(checkLine.getMaterialName())
                        .sequence(seq++)
                        .quantity(checkLine.getActualQuantity())
                        .build();
                movementLineRepository.save(movementLine);

                // Update the stock entry to actual quantity
                StockEntry stockEntry = stockEntryRepository
                        .findByMaterialIdAndLocationIdAndDeletedFalse(checkLine.getMaterialId(), check.getLocationId())
                        .orElse(null);

                if (stockEntry != null) {
                    stockEntry.setQuantity(checkLine.getActualQuantity());
                    stockEntry.recalculate();
                    stockEntryRepository.save(stockEntry);
                }
            }

            auditService.logCreate("StockMovement", adjustmentMovement.getId());
            log.info("Adjustment movement {} created for inventory check {} with {} variance lines",
                    adjustmentMovement.getNumber(), check.getName(), linesWithVariance.size());
        }

        InventoryCheckStatus oldStatus = check.getStatus();
        check.setStatus(InventoryCheckStatus.COMPLETED);
        check = checkRepository.save(check);
        auditService.logStatusChange("InventoryCheck", check.getId(), oldStatus.name(), InventoryCheckStatus.COMPLETED.name());

        log.info("Inventory check completed: {} ({})", check.getName(), check.getId());
        List<InventoryCheckLineResponse> lineResponses = getCheckLines(id);
        return InventoryCheckResponse.fromEntity(check, lineResponses);
    }

    @Transactional
    public InventoryCheckResponse cancelCheck(UUID id) {
        InventoryCheck check = getCheckOrThrow(id);

        if (check.getStatus() == InventoryCheckStatus.COMPLETED || check.getStatus() == InventoryCheckStatus.CANCELLED) {
            throw new IllegalStateException("Невозможно отменить инвентаризацию в статусе " + check.getStatus().getDisplayName());
        }

        InventoryCheckStatus oldStatus = check.getStatus();
        check.setStatus(InventoryCheckStatus.CANCELLED);
        check = checkRepository.save(check);
        auditService.logStatusChange("InventoryCheck", check.getId(), oldStatus.name(), InventoryCheckStatus.CANCELLED.name());

        log.info("Inventory check cancelled: {} ({})", check.getName(), check.getId());
        List<InventoryCheckLineResponse> lines = getCheckLines(id);
        return InventoryCheckResponse.fromEntity(check, lines);
    }

    private InventoryCheck getCheckOrThrow(UUID id) {
        return checkRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Инвентаризация не найдена: " + id));
    }

    private String generateCheckName() {
        long seq = checkRepository.getNextNumberSequence();
        return String.format("INV-%05d", seq);
    }

    private String generateAdjustmentNumber() {
        long seq = movementRepository.getNextNumberSequence();
        return String.format("MOV-%05d", seq);
    }
}
