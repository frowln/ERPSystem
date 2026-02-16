package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementLineRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementLineRequest;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementRequest;
import com.privod.platform.modules.warehouse.web.dto.StockMovementLineResponse;
import com.privod.platform.modules.warehouse.web.dto.StockMovementResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockMovementRequest;
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
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final StockMovementLineRepository lineRepository;
    private final StockEntryRepository stockEntryRepository;
    private final MaterialRepository materialRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> listMovements(StockMovementStatus status, StockMovementType movementType,
                                                      UUID projectId, Pageable pageable) {
        Specification<StockMovement> spec = Specification
                .where(StockMovementSpecification.notDeleted())
                .and(StockMovementSpecification.hasStatus(status))
                .and(StockMovementSpecification.hasMovementType(movementType))
                .and(StockMovementSpecification.belongsToProject(projectId));

        return movementRepository.findAll(spec, pageable)
                .map(movement -> {
                    List<StockMovementLineResponse> lines = getMovementLines(movement.getId());
                    return StockMovementResponse.fromEntity(movement, lines);
                });
    }

    @Transactional(readOnly = true)
    public StockMovementResponse getMovement(UUID id) {
        StockMovement movement = getMovementOrThrow(id);
        List<StockMovementLineResponse> lines = getMovementLines(id);
        return StockMovementResponse.fromEntity(movement, lines);
    }

    @Transactional(readOnly = true)
    public List<StockMovementLineResponse> getMovementLines(UUID movementId) {
        return lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId)
                .stream()
                .map(StockMovementLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public StockMovementResponse createMovement(CreateStockMovementRequest request) {
        validateMovementLocations(request.movementType(), request.sourceLocationId(), request.destinationLocationId());

        String number = generateMovementNumber();

        StockMovement movement = StockMovement.builder()
                .number(number)
                .movementDate(request.movementDate())
                .movementType(request.movementType())
                .status(StockMovementStatus.DRAFT)
                .projectId(request.projectId())
                .sourceLocationId(request.sourceLocationId())
                .destinationLocationId(request.destinationLocationId())
                .purchaseRequestId(request.purchaseRequestId())
                .m29Id(request.m29Id())
                .responsibleId(request.responsibleId())
                .responsibleName(request.responsibleName())
                .notes(request.notes())
                .build();

        movement = movementRepository.save(movement);
        auditService.logCreate("StockMovement", movement.getId());

        log.info("Stock movement created: {} ({}) type={}", movement.getNumber(), movement.getId(), movement.getMovementType());
        return StockMovementResponse.fromEntity(movement, List.of());
    }

    @Transactional
    public StockMovementResponse updateMovement(UUID id, UpdateStockMovementRequest request) {
        StockMovement movement = getMovementOrThrow(id);

        if (movement.getStatus() != StockMovementStatus.DRAFT) {
            throw new IllegalStateException("Редактирование движения возможно только в статусе Черновик");
        }

        if (request.movementDate() != null) {
            movement.setMovementDate(request.movementDate());
        }
        if (request.movementType() != null) {
            movement.setMovementType(request.movementType());
        }
        if (request.projectId() != null) {
            movement.setProjectId(request.projectId());
        }
        if (request.sourceLocationId() != null) {
            movement.setSourceLocationId(request.sourceLocationId());
        }
        if (request.destinationLocationId() != null) {
            movement.setDestinationLocationId(request.destinationLocationId());
        }
        if (request.purchaseRequestId() != null) {
            movement.setPurchaseRequestId(request.purchaseRequestId());
        }
        if (request.m29Id() != null) {
            movement.setM29Id(request.m29Id());
        }
        if (request.responsibleId() != null) {
            movement.setResponsibleId(request.responsibleId());
        }
        if (request.responsibleName() != null) {
            movement.setResponsibleName(request.responsibleName());
        }
        if (request.notes() != null) {
            movement.setNotes(request.notes());
        }

        movement = movementRepository.save(movement);
        auditService.logUpdate("StockMovement", movement.getId(), "multiple", null, null);

        List<StockMovementLineResponse> lines = getMovementLines(id);
        log.info("Stock movement updated: {} ({})", movement.getNumber(), movement.getId());
        return StockMovementResponse.fromEntity(movement, lines);
    }

    @Transactional
    public StockMovementLineResponse addLine(UUID movementId, CreateStockMovementLineRequest request) {
        StockMovement movement = getMovementOrThrow(movementId);

        if (movement.getStatus() != StockMovementStatus.DRAFT) {
            throw new IllegalStateException("Добавление строк возможно только в статусе Черновик");
        }

        Material material = materialRepository.findById(request.materialId())
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Материал не найден: " + request.materialId()));

        StockMovementLine line = StockMovementLine.builder()
                .movementId(movementId)
                .materialId(request.materialId())
                .materialName(request.materialName() != null ? request.materialName() : material.getName())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .quantity(request.quantity())
                .unitPrice(request.unitPrice())
                .unitOfMeasure(request.unitOfMeasure() != null ? request.unitOfMeasure() : material.getUnitOfMeasure())
                .notes(request.notes())
                .build();

        line.recalculateTotal();
        line = lineRepository.save(line);

        log.info("Movement line added: material={} qty={} to movement {}",
                material.getName(), request.quantity(), movement.getNumber());
        return StockMovementLineResponse.fromEntity(line);
    }

    @Transactional
    public StockMovementResponse confirmMovement(UUID id) {
        StockMovement movement = getMovementOrThrow(id);

        if (!movement.canTransitionTo(StockMovementStatus.CONFIRMED)) {
            throw new IllegalStateException(
                    String.format("Невозможно подтвердить движение из статуса %s",
                            movement.getStatus().getDisplayName()));
        }

        List<StockMovementLine> lines = lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(id);
        if (lines.isEmpty()) {
            throw new IllegalStateException("Невозможно подтвердить движение без строк");
        }

        // Validate quantities for ISSUE, TRANSFER, WRITE_OFF - check available stock
        if (movement.getMovementType() == StockMovementType.ISSUE
                || movement.getMovementType() == StockMovementType.TRANSFER
                || movement.getMovementType() == StockMovementType.WRITE_OFF) {

            UUID sourceLocationId = movement.getSourceLocationId();
            if (sourceLocationId == null) {
                throw new IllegalStateException("Для расхода/перемещения/списания необходимо указать склад-источник");
            }

            for (StockMovementLine line : lines) {
                StockEntry stockEntry = stockEntryRepository
                        .findByMaterialIdAndLocationIdAndDeletedFalse(line.getMaterialId(), sourceLocationId)
                        .orElse(null);

                BigDecimal available = stockEntry != null ? stockEntry.getAvailableQuantity() : BigDecimal.ZERO;
                if (available.compareTo(line.getQuantity()) < 0) {
                    throw new IllegalStateException(
                            String.format("Недостаточно материала '%s' на складе. Доступно: %s, Требуется: %s",
                                    line.getMaterialName(), available, line.getQuantity()));
                }
            }
        }

        StockMovementStatus oldStatus = movement.getStatus();
        movement.setStatus(StockMovementStatus.CONFIRMED);
        movement = movementRepository.save(movement);
        auditService.logStatusChange("StockMovement", movement.getId(), oldStatus.name(), StockMovementStatus.CONFIRMED.name());

        log.info("Stock movement confirmed: {} ({})", movement.getNumber(), movement.getId());
        List<StockMovementLineResponse> lineResponses = getMovementLines(id);
        return StockMovementResponse.fromEntity(movement, lineResponses);
    }

    @Transactional
    public StockMovementResponse executeMovement(UUID id) {
        StockMovement movement = getMovementOrThrow(id);

        if (!movement.canTransitionTo(StockMovementStatus.DONE)) {
            throw new IllegalStateException(
                    String.format("Невозможно выполнить движение из статуса %s",
                            movement.getStatus().getDisplayName()));
        }

        List<StockMovementLine> lines = lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(id);

        for (StockMovementLine line : lines) {
            applyStockMovementLine(movement, line);
        }

        StockMovementStatus oldStatus = movement.getStatus();
        movement.setStatus(StockMovementStatus.DONE);
        movement = movementRepository.save(movement);
        auditService.logStatusChange("StockMovement", movement.getId(), oldStatus.name(), StockMovementStatus.DONE.name());

        log.info("Stock movement executed: {} ({}) - {} lines processed",
                movement.getNumber(), movement.getId(), lines.size());
        List<StockMovementLineResponse> lineResponses = getMovementLines(id);
        return StockMovementResponse.fromEntity(movement, lineResponses);
    }

    @Transactional
    public StockMovementResponse cancelMovement(UUID id) {
        StockMovement movement = getMovementOrThrow(id);

        if (!movement.canTransitionTo(StockMovementStatus.CANCELLED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить движение из статуса %s",
                            movement.getStatus().getDisplayName()));
        }

        // If DONE, reverse the stock changes
        if (movement.getStatus() == StockMovementStatus.DONE) {
            List<StockMovementLine> lines = lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(id);
            for (StockMovementLine line : lines) {
                reverseStockMovementLine(movement, line);
            }
            log.info("Stock movement reversed: {} ({})", movement.getNumber(), movement.getId());
        }

        StockMovementStatus oldStatus = movement.getStatus();
        movement.setStatus(StockMovementStatus.CANCELLED);
        movement = movementRepository.save(movement);
        auditService.logStatusChange("StockMovement", movement.getId(), oldStatus.name(), StockMovementStatus.CANCELLED.name());

        log.info("Stock movement cancelled: {} ({})", movement.getNumber(), movement.getId());
        List<StockMovementLineResponse> lineResponses = getMovementLines(id);
        return StockMovementResponse.fromEntity(movement, lineResponses);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getMovementHistory(UUID locationId, LocalDate dateFrom,
                                                            LocalDate dateTo, Pageable pageable) {
        Specification<StockMovement> spec = Specification
                .where(StockMovementSpecification.notDeleted())
                .and(StockMovementSpecification.hasLocation(locationId))
                .and(StockMovementSpecification.dateRange(dateFrom, dateTo));

        return movementRepository.findAll(spec, pageable)
                .map(movement -> {
                    List<StockMovementLineResponse> lines = getMovementLines(movement.getId());
                    return StockMovementResponse.fromEntity(movement, lines);
                });
    }

    @Transactional
    public StockMovementResponse createReceiptFromPurchase(UUID purchaseRequestId, UUID destinationLocationId,
                                                            UUID responsibleId, String responsibleName) {
        StockMovement movement = StockMovement.builder()
                .number(generateMovementNumber())
                .movementDate(LocalDate.now())
                .movementType(StockMovementType.RECEIPT)
                .status(StockMovementStatus.DRAFT)
                .purchaseRequestId(purchaseRequestId)
                .destinationLocationId(destinationLocationId)
                .responsibleId(responsibleId)
                .responsibleName(responsibleName)
                .notes("Автоматически создано из заявки на закупку: " + purchaseRequestId)
                .build();

        movement = movementRepository.save(movement);
        auditService.logCreate("StockMovement", movement.getId());

        log.info("Receipt movement created from purchase request: {} -> {}",
                purchaseRequestId, movement.getNumber());
        return StockMovementResponse.fromEntity(movement, List.of());
    }

    @Transactional
    public void deleteMovement(UUID id) {
        StockMovement movement = getMovementOrThrow(id);

        if (movement.getStatus() != StockMovementStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только движение в статусе Черновик");
        }

        movement.softDelete();
        movementRepository.save(movement);
        auditService.logDelete("StockMovement", id);

        log.info("Stock movement deleted: {} ({})", movement.getNumber(), id);
    }

    // ---------- Private helpers ----------

    private void applyStockMovementLine(StockMovement movement, StockMovementLine line) {
        switch (movement.getMovementType()) {
            case RECEIPT, RETURN -> addStock(movement.getDestinationLocationId(), line);
            case ISSUE, WRITE_OFF -> subtractStock(movement.getSourceLocationId(), line);
            case TRANSFER -> {
                subtractStock(movement.getSourceLocationId(), line);
                addStock(movement.getDestinationLocationId(), line);
            }
            case ADJUSTMENT -> {
                if (movement.getDestinationLocationId() != null) {
                    adjustStock(movement.getDestinationLocationId(), line);
                } else if (movement.getSourceLocationId() != null) {
                    adjustStock(movement.getSourceLocationId(), line);
                }
            }
        }
    }

    private void reverseStockMovementLine(StockMovement movement, StockMovementLine line) {
        switch (movement.getMovementType()) {
            case RECEIPT, RETURN -> subtractStock(movement.getDestinationLocationId(), line);
            case ISSUE, WRITE_OFF -> addStock(movement.getSourceLocationId(), line);
            case TRANSFER -> {
                addStock(movement.getSourceLocationId(), line);
                subtractStock(movement.getDestinationLocationId(), line);
            }
            case ADJUSTMENT -> {
                if (movement.getDestinationLocationId() != null) {
                    reverseAdjustStock(movement.getDestinationLocationId(), line);
                } else if (movement.getSourceLocationId() != null) {
                    reverseAdjustStock(movement.getSourceLocationId(), line);
                }
            }
        }
    }

    private void addStock(UUID locationId, StockMovementLine line) {
        StockEntry entry = getOrCreateStockEntry(locationId, line.getMaterialId(), line.getMaterialName());
        entry.setQuantity(entry.getQuantity().add(line.getQuantity()));
        if (line.getUnitPrice() != null) {
            entry.setLastPricePerUnit(line.getUnitPrice());
        }
        entry.recalculate();
        stockEntryRepository.save(entry);
    }

    private void subtractStock(UUID locationId, StockMovementLine line) {
        StockEntry entry = stockEntryRepository
                .findByMaterialIdAndLocationIdAndDeletedFalse(line.getMaterialId(), locationId)
                .orElseThrow(() -> new IllegalStateException(
                        String.format("Остаток материала '%s' не найден на складе", line.getMaterialName())));

        BigDecimal newQuantity = entry.getQuantity().subtract(line.getQuantity());
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException(
                    String.format("Недостаточно материала '%s' на складе. Доступно: %s, Требуется: %s",
                            line.getMaterialName(), entry.getQuantity(), line.getQuantity()));
        }
        entry.setQuantity(newQuantity);
        entry.recalculate();
        stockEntryRepository.save(entry);
    }

    private void adjustStock(UUID locationId, StockMovementLine line) {
        StockEntry entry = getOrCreateStockEntry(locationId, line.getMaterialId(), line.getMaterialName());
        entry.setQuantity(line.getQuantity()); // Set to exact quantity for adjustment
        if (line.getUnitPrice() != null) {
            entry.setLastPricePerUnit(line.getUnitPrice());
        }
        entry.recalculate();
        stockEntryRepository.save(entry);
    }

    private void reverseAdjustStock(UUID locationId, StockMovementLine line) {
        // For adjustment reversal, we cannot fully reverse since we lost the old quantity.
        // Log a warning - this is a best-effort reversal.
        log.warn("Adjustment reversal for material {} at location {} - manual review recommended",
                line.getMaterialName(), locationId);
    }

    private StockEntry getOrCreateStockEntry(UUID locationId, UUID materialId, String materialName) {
        return stockEntryRepository
                .findByMaterialIdAndLocationIdAndDeletedFalse(materialId, locationId)
                .orElseGet(() -> {
                    StockEntry newEntry = StockEntry.builder()
                            .materialId(materialId)
                            .materialName(materialName)
                            .locationId(locationId)
                            .quantity(BigDecimal.ZERO)
                            .reservedQuantity(BigDecimal.ZERO)
                            .availableQuantity(BigDecimal.ZERO)
                            .totalValue(BigDecimal.ZERO)
                            .build();
                    return stockEntryRepository.save(newEntry);
                });
    }

    private void validateMovementLocations(StockMovementType type, UUID sourceId, UUID destinationId) {
        switch (type) {
            case RECEIPT, RETURN -> {
                if (destinationId == null) {
                    throw new IllegalArgumentException("Для прихода/возврата необходимо указать склад назначения");
                }
            }
            case ISSUE, WRITE_OFF -> {
                if (sourceId == null) {
                    throw new IllegalArgumentException("Для расхода/списания необходимо указать склад-источник");
                }
            }
            case TRANSFER -> {
                if (sourceId == null || destinationId == null) {
                    throw new IllegalArgumentException("Для перемещения необходимо указать оба склада");
                }
            }
            case ADJUSTMENT -> {
                if (sourceId == null && destinationId == null) {
                    throw new IllegalArgumentException("Для корректировки необходимо указать хотя бы один склад");
                }
            }
        }
    }

    StockMovement getMovementOrThrow(UUID id) {
        return movementRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Движение не найдено: " + id));
    }

    private String generateMovementNumber() {
        long seq = movementRepository.getNextNumberSequence();
        return String.format("MOV-%05d", seq);
    }
}
