package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.domain.StockBatch;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockBatchRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementLineRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.repository.WarehouseLocationRepository;
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
import java.math.RoundingMode;
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
    private final StockBatchRepository stockBatchRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> listMovements(StockMovementStatus status, StockMovementType movementType,
                                                      UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        Specification<StockMovement> spec = Specification
                .where(StockMovementSpecification.belongsToOrganization(organizationId))
                .and(StockMovementSpecification.notDeleted())
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);
        List<StockMovementLineResponse> lines = getMovementLines(id);
        return StockMovementResponse.fromEntity(movement, lines);
    }

    @Transactional(readOnly = true)
    public List<StockMovementLineResponse> getMovementLines(UUID movementId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getMovementOrThrow(movementId, organizationId);
        return lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId)
                .stream()
                .map(StockMovementLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public StockMovementResponse createMovement(CreateStockMovementRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateMovementLocations(request.movementType(), request.sourceLocationId(), request.destinationLocationId(), organizationId);
        validateProjectTenant(request.projectId(), organizationId);
        validateUserTenant(request.responsibleId(), organizationId);
        validatePurchaseRequestTenant(request.purchaseRequestId(), organizationId);

        String number = generateMovementNumber();

        StockMovement movement = StockMovement.builder()
                .organizationId(organizationId)
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);

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
            validateProjectTenant(request.projectId(), organizationId);
            movement.setProjectId(request.projectId());
        }
        if (request.sourceLocationId() != null) {
            validateLocationTenant(request.sourceLocationId(), organizationId);
            movement.setSourceLocationId(request.sourceLocationId());
        }
        if (request.destinationLocationId() != null) {
            validateLocationTenant(request.destinationLocationId(), organizationId);
            movement.setDestinationLocationId(request.destinationLocationId());
        }
        if (request.purchaseRequestId() != null) {
            validatePurchaseRequestTenant(request.purchaseRequestId(), organizationId);
            movement.setPurchaseRequestId(request.purchaseRequestId());
        }
        if (request.m29Id() != null) {
            movement.setM29Id(request.m29Id());
        }
        if (request.responsibleId() != null) {
            validateUserTenant(request.responsibleId(), organizationId);
            movement.setResponsibleId(request.responsibleId());
        }
        if (request.responsibleName() != null) {
            movement.setResponsibleName(request.responsibleName());
        }
        if (request.notes() != null) {
            movement.setNotes(request.notes());
        }
        validateMovementLocations(
                movement.getMovementType(),
                movement.getSourceLocationId(),
                movement.getDestinationLocationId(),
                organizationId
        );

        movement = movementRepository.save(movement);
        auditService.logUpdate("StockMovement", movement.getId(), "multiple", null, null);

        List<StockMovementLineResponse> lines = getMovementLines(id);
        log.info("Stock movement updated: {} ({})", movement.getNumber(), movement.getId());
        return StockMovementResponse.fromEntity(movement, lines);
    }

    @Transactional
    public StockMovementLineResponse addLine(UUID movementId, CreateStockMovementLineRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(movementId, organizationId);

        if (movement.getStatus() != StockMovementStatus.DRAFT) {
            throw new IllegalStateException("Добавление строк возможно только в статусе Черновик");
        }

        Material material = materialRepository.findByIdAndOrganizationIdAndDeletedFalse(request.materialId(), organizationId)
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);

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
                        .findByMaterialIdAndLocationIdAndOrganizationIdAndDeletedFalse(
                                line.getMaterialId(),
                                sourceLocationId,
                                organizationId
                        )
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);

        if (!movement.canTransitionTo(StockMovementStatus.DONE)) {
            throw new IllegalStateException(
                    String.format("Невозможно выполнить движение из статуса %s",
                            movement.getStatus().getDisplayName()));
        }

        List<StockMovementLine> lines = lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(id);

        for (StockMovementLine line : lines) {
            applyStockMovementLine(movement, line, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);

        if (!movement.canTransitionTo(StockMovementStatus.CANCELLED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить движение из статуса %s",
                            movement.getStatus().getDisplayName()));
        }

        // If DONE, reverse the stock changes
        if (movement.getStatus() == StockMovementStatus.DONE) {
            List<StockMovementLine> lines = lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(id);
            for (StockMovementLine line : lines) {
                reverseStockMovementLine(movement, line, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateLocationTenant(locationId, organizationId);

        Specification<StockMovement> spec = Specification
                .where(StockMovementSpecification.belongsToOrganization(organizationId))
                .and(StockMovementSpecification.notDeleted())
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validatePurchaseRequestTenant(purchaseRequestId, organizationId);
        validateLocationTenant(destinationLocationId, organizationId);
        validateUserTenant(responsibleId, organizationId);

        StockMovement movement = StockMovement.builder()
                .organizationId(organizationId)
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

    /**
     * P1-WAR-3: Авто-создание приходного ордера при поступлении доставки.
     * Вызывается из ProcurementExtService когда Delivery.status → DELIVERED.
     * Создаёт StockMovement(RECEIPT, DRAFT) без привязки к складу —
     * кладовщик указывает склад при подтверждении.
     *
     * @param deliveryId  ID доставки (для трассировки в notes)
     * @param orgId       организация
     * @param itemMaterialIds   materialId позиций доставки
     * @param itemQuantities    количество позиций доставки
     * @param itemUnits         единицы измерения позиций доставки
     */
    @Transactional
    public StockMovementResponse createAutoReceiptFromDelivery(
            UUID deliveryId, UUID orgId,
            List<UUID> itemMaterialIds,
            List<BigDecimal> itemQuantities,
            List<String> itemUnits) {

        StockMovement movement = StockMovement.builder()
                .organizationId(orgId)
                .number(generateMovementNumber())
                .movementDate(LocalDate.now())
                .movementType(StockMovementType.RECEIPT)
                .status(StockMovementStatus.DRAFT)
                .notes("Авто-приходный ордер из доставки: " + deliveryId)
                .build();

        movement = movementRepository.save(movement);

        for (int i = 0; i < itemMaterialIds.size(); i++) {
            UUID materialId = itemMaterialIds.get(i);
            BigDecimal qty = itemQuantities.get(i);
            String unit = i < itemUnits.size() ? itemUnits.get(i) : null;

            Material material = materialRepository.findById(materialId).orElse(null);
            String materialName = material != null ? material.getName() : materialId.toString();

            StockMovementLine line = StockMovementLine.builder()
                    .movementId(movement.getId())
                    .materialId(materialId)
                    .materialName(materialName)
                    .sequence(i + 1)
                    .quantity(qty)
                    .unitOfMeasure(unit != null ? unit : (material != null ? material.getUnitOfMeasure() : null))
                    .build();
            line.recalculateTotal();
            lineRepository.save(line);
        }

        auditService.logCreate("StockMovement", movement.getId());
        log.info("Авто-приходный ордер создан из доставки {}: {} ({} позиций)",
                deliveryId, movement.getNumber(), itemMaterialIds.size());

        List<StockMovementLineResponse> lines = getMovementLines(movement.getId());
        return StockMovementResponse.fromEntity(movement, lines);
    }

    @Transactional
    public void deleteMovement(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockMovement movement = getMovementOrThrow(id, organizationId);

        if (movement.getStatus() != StockMovementStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только движение в статусе Черновик");
        }

        movement.softDelete();
        movementRepository.save(movement);
        auditService.logDelete("StockMovement", id);

        log.info("Stock movement deleted: {} ({})", movement.getNumber(), id);
    }

    // ---------- Private helpers ----------

    private void applyStockMovementLine(StockMovement movement, StockMovementLine line, UUID organizationId) {
        switch (movement.getMovementType()) {
            case RECEIPT, RETURN -> addStock(movement.getDestinationLocationId(), line, organizationId);
            case ISSUE, WRITE_OFF -> subtractStock(movement.getSourceLocationId(), line, organizationId);
            case TRANSFER -> {
                subtractStock(movement.getSourceLocationId(), line, organizationId);
                addStock(movement.getDestinationLocationId(), line, organizationId);
            }
            case ADJUSTMENT -> {
                if (movement.getDestinationLocationId() != null) {
                    adjustStock(movement.getDestinationLocationId(), line, organizationId);
                } else if (movement.getSourceLocationId() != null) {
                    adjustStock(movement.getSourceLocationId(), line, organizationId);
                }
            }
        }
    }

    private void reverseStockMovementLine(StockMovement movement, StockMovementLine line, UUID organizationId) {
        switch (movement.getMovementType()) {
            case RECEIPT, RETURN -> subtractStock(movement.getDestinationLocationId(), line, organizationId);
            case ISSUE, WRITE_OFF -> addStock(movement.getSourceLocationId(), line, organizationId);
            case TRANSFER -> {
                addStock(movement.getSourceLocationId(), line, organizationId);
                subtractStock(movement.getDestinationLocationId(), line, organizationId);
            }
            case ADJUSTMENT -> {
                if (movement.getDestinationLocationId() != null) {
                    reverseAdjustStock(movement.getDestinationLocationId(), line, organizationId);
                } else if (movement.getSourceLocationId() != null) {
                    reverseAdjustStock(movement.getSourceLocationId(), line, organizationId);
                }
            }
        }
    }

    private void addStock(UUID locationId, StockMovementLine line, UUID organizationId) {
        StockEntry entry = getOrCreateStockEntry(locationId, line.getMaterialId(), line.getMaterialName(), organizationId);

        // P0-WAR-1: ФСБУ 5/2019 — создать партию и пересчитать средневзвешенную цену
        BigDecimal unitPrice = line.getUnitPrice() != null ? line.getUnitPrice() : BigDecimal.ZERO;
        createBatch(line, locationId, organizationId, unitPrice);

        // Получить обновлённую средневзвешенную цену из партий
        BigDecimal weightedAvg = stockBatchRepository.computeWeightedAvgPrice(
                organizationId, line.getMaterialId(), locationId);
        if (weightedAvg != null && weightedAvg.compareTo(BigDecimal.ZERO) > 0) {
            entry.setLastPricePerUnit(weightedAvg.setScale(4, RoundingMode.HALF_UP));
        } else if (unitPrice.compareTo(BigDecimal.ZERO) > 0) {
            entry.setLastPricePerUnit(unitPrice);
        }

        entry.setQuantity(entry.getQuantity().add(line.getQuantity()));
        entry.recalculate();
        stockEntryRepository.save(entry);
    }

    /**
     * P0-WAR-1: ФСБУ 5/2019 — создаёт новую партию при каждом RECEIPT / RETURN.
     * Партия содержит цену прихода и начальное/остаточное количество.
     *
     * @param line         строка движения (содержит materialId, quantity)
     * @param locationId   склад назначения
     * @param organizationId организация
     * @param unitCostPrice цена единицы на дату прихода
     */
    private void createBatch(StockMovementLine line, UUID locationId,
                              UUID organizationId, BigDecimal unitCostPrice) {
        // Получаем movementId через связь (movementId хранится прямо в строке)
        StockBatch batch = StockBatch.builder()
                .organizationId(organizationId)
                .materialId(line.getMaterialId())
                .locationId(locationId)
                .receiptDate(LocalDate.now())
                .unitCostPrice(unitCostPrice)
                .originalQty(line.getQuantity())
                .remainingQty(line.getQuantity())
                .stockMovementId(line.getMovementId())
                .build();
        stockBatchRepository.save(batch);
        log.debug("P0-WAR-1: партия создана material={} qty={} price={} location={}",
                line.getMaterialId(), line.getQuantity(), unitCostPrice, locationId);
    }

    private void subtractStock(UUID locationId, StockMovementLine line, UUID organizationId) {
        StockEntry entry = stockEntryRepository
                .findByMaterialIdAndLocationIdAndOrganizationIdAndDeletedFalse(line.getMaterialId(), locationId, organizationId)
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

    private void adjustStock(UUID locationId, StockMovementLine line, UUID organizationId) {
        StockEntry entry = getOrCreateStockEntry(locationId, line.getMaterialId(), line.getMaterialName(), organizationId);
        entry.setQuantity(line.getQuantity()); // Set to exact quantity for adjustment
        if (line.getUnitPrice() != null) {
            entry.setLastPricePerUnit(line.getUnitPrice());
        }
        entry.recalculate();
        stockEntryRepository.save(entry);
    }

    private void reverseAdjustStock(UUID locationId, StockMovementLine line, UUID organizationId) {
        // For adjustment reversal, we cannot fully reverse since we lost the old quantity.
        // Log a warning - this is a best-effort reversal.
        log.warn("Adjustment reversal for material {} at location {} for org {} - manual review recommended",
                line.getMaterialName(), locationId, organizationId);
    }

    private StockEntry getOrCreateStockEntry(UUID locationId, UUID materialId, String materialName, UUID organizationId) {
        return stockEntryRepository
                .findByMaterialIdAndLocationIdAndOrganizationIdAndDeletedFalse(materialId, locationId, organizationId)
                .orElseGet(() -> {
                    StockEntry newEntry = StockEntry.builder()
                            .organizationId(organizationId)
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

    private void validateMovementLocations(StockMovementType type, UUID sourceId, UUID destinationId, UUID organizationId) {
        switch (type) {
            case RECEIPT, RETURN -> {
                if (destinationId == null) {
                    throw new IllegalArgumentException("Для прихода/возврата необходимо указать склад назначения");
                }
                validateLocationTenant(destinationId, organizationId);
            }
            case ISSUE, WRITE_OFF -> {
                if (sourceId == null) {
                    throw new IllegalArgumentException("Для расхода/списания необходимо указать склад-источник");
                }
                validateLocationTenant(sourceId, organizationId);
            }
            case TRANSFER -> {
                if (sourceId == null || destinationId == null) {
                    throw new IllegalArgumentException("Для перемещения необходимо указать оба склада");
                }
                validateLocationTenant(sourceId, organizationId);
                validateLocationTenant(destinationId, organizationId);
            }
            case ADJUSTMENT -> {
                if (sourceId == null && destinationId == null) {
                    throw new IllegalArgumentException("Для корректировки необходимо указать хотя бы один склад");
                }
                if (sourceId != null) {
                    validateLocationTenant(sourceId, organizationId);
                }
                if (destinationId != null) {
                    validateLocationTenant(destinationId, organizationId);
                }
            }
        }
    }

    StockMovement getMovementOrThrow(UUID id, UUID organizationId) {
        return movementRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Движение не найдено: " + id));
    }

    private String generateMovementNumber() {
        long seq = movementRepository.getNextNumberSequence();
        return String.format("MOV-%05d", seq);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private void validateLocationTenant(UUID locationId, UUID organizationId) {
        if (locationId == null) {
            return;
        }
        warehouseLocationRepository.findByIdAndOrganizationIdAndDeletedFalse(locationId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Складская локация не найдена: " + locationId));
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        if (userId == null) {
            return;
        }
        userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
    }

    private void validatePurchaseRequestTenant(UUID purchaseRequestId, UUID organizationId) {
        if (purchaseRequestId == null) {
            return;
        }
        purchaseRequestRepository.findByIdAndOrganizationIdAndDeletedFalse(purchaseRequestId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка на закупку не найдена: " + purchaseRequestId));
    }
}
