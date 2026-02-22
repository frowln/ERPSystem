package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockLimit;
import com.privod.platform.modules.warehouse.domain.StockLimitAlert;
import com.privod.platform.modules.warehouse.domain.StockLimitType;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitAlertRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitRepository;
import com.privod.platform.modules.warehouse.repository.WarehouseLocationRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateStockLimitRequest;
import com.privod.platform.modules.warehouse.web.dto.StockLimitAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.StockLimitResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockLimitRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockLimitService {

    private final StockLimitRepository stockLimitRepository;
    private final StockLimitAlertRepository stockLimitAlertRepository;
    private final StockEntryRepository stockEntryRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StockLimitResponse> listLimits(UUID materialId, UUID warehouseLocationId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (materialId != null) {
            validateMaterialTenant(materialId, organizationId);
            return stockLimitRepository.findByOrganizationIdAndMaterialIdAndDeletedFalse(organizationId, materialId, pageable)
                    .map(StockLimitResponse::fromEntity);
        }
        if (warehouseLocationId != null) {
            validateLocationTenant(warehouseLocationId, organizationId);
            return stockLimitRepository.findByOrganizationIdAndWarehouseLocationIdAndDeletedFalse(organizationId, warehouseLocationId, pageable)
                    .map(StockLimitResponse::fromEntity);
        }
        return stockLimitRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(StockLimitResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public StockLimitResponse getLimit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockLimit limit = getLimitOrThrow(id, organizationId);
        return StockLimitResponse.fromEntity(limit);
    }

    @Transactional
    public StockLimitResponse createLimit(CreateStockLimitRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateMaterialTenant(request.materialId(), organizationId);
        validateLocationTenant(request.warehouseLocationId(), organizationId);

        StockLimit limit = StockLimit.builder()
                .organizationId(organizationId)
                .materialId(request.materialId())
                .warehouseLocationId(request.warehouseLocationId())
                .minQuantity(request.minQuantity())
                .maxQuantity(request.maxQuantity())
                .reorderPoint(request.reorderPoint())
                .reorderQuantity(request.reorderQuantity())
                .unit(request.unit())
                .isActive(true)
                .build();

        limit = stockLimitRepository.save(limit);
        auditService.logCreate("StockLimit", limit.getId());

        log.info("Stock limit created for material {} at location {} ({})",
                request.materialId(), request.warehouseLocationId(), limit.getId());
        return StockLimitResponse.fromEntity(limit);
    }

    @Transactional
    public StockLimitResponse updateLimit(UUID id, UpdateStockLimitRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockLimit limit = getLimitOrThrow(id, organizationId);

        if (request.minQuantity() != null) {
            limit.setMinQuantity(request.minQuantity());
        }
        if (request.maxQuantity() != null) {
            limit.setMaxQuantity(request.maxQuantity());
        }
        if (request.reorderPoint() != null) {
            limit.setReorderPoint(request.reorderPoint());
        }
        if (request.reorderQuantity() != null) {
            limit.setReorderQuantity(request.reorderQuantity());
        }
        if (request.unit() != null) {
            limit.setUnit(request.unit());
        }
        if (request.isActive() != null) {
            limit.setActive(request.isActive());
        }

        limit = stockLimitRepository.save(limit);
        auditService.logUpdate("StockLimit", limit.getId(), "multiple", null, null);

        log.info("Stock limit updated: {}", limit.getId());
        return StockLimitResponse.fromEntity(limit);
    }

    @Transactional
    public void deleteLimit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        StockLimit limit = getLimitOrThrow(id, organizationId);
        limit.softDelete();
        stockLimitRepository.save(limit);
        auditService.logDelete("StockLimit", limit.getId());

        log.info("Stock limit deleted: {}", id);
    }

    @Transactional
    public List<StockLimitAlertResponse> checkLimits() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<StockLimit> activeLimits = stockLimitRepository.findByOrganizationIdAndIsActiveTrueAndDeletedFalse(organizationId);
        List<StockLimitAlertResponse> newAlerts = new ArrayList<>();

        for (StockLimit limit : activeLimits) {
            boolean createdForCurrentLimit = false;
            Optional<StockEntry> entryOpt = stockEntryRepository
                    .findByMaterialIdAndLocationIdAndOrganizationIdAndDeletedFalse(
                            limit.getMaterialId(),
                            limit.getWarehouseLocationId(),
                            organizationId
                    );

            BigDecimal currentQty = entryOpt.map(StockEntry::getQuantity).orElse(BigDecimal.ZERO);
            String materialName = entryOpt.map(StockEntry::getMaterialName).orElse(null);

            // Check below minimum
            if (limit.getMinQuantity() != null && currentQty.compareTo(limit.getMinQuantity()) < 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.BELOW_MIN, StockAlertSeverity.CRITICAL, organizationId);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
                createdForCurrentLimit = true;
            }

            // Check above maximum
            if (limit.getMaxQuantity() != null && currentQty.compareTo(limit.getMaxQuantity()) > 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.ABOVE_MAX, StockAlertSeverity.WARNING, organizationId);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
                createdForCurrentLimit = true;
            }

            // Check reorder point
            if (limit.getReorderPoint() != null && currentQty.compareTo(limit.getReorderPoint()) <= 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.REORDER_POINT, StockAlertSeverity.INFO, organizationId);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
                createdForCurrentLimit = true;
            }

            if (createdForCurrentLimit) {
                limit.setLastAlertAt(LocalDateTime.now());
                stockLimitRepository.save(limit);
            }
        }

        log.info("Stock limits checked: {} active limits, {} new alerts generated",
                activeLimits.size(), newAlerts.size());
        return newAlerts;
    }

    @Transactional(readOnly = true)
    public Page<StockLimitAlertResponse> getActiveAlerts(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return stockLimitAlertRepository.findByOrganizationIdAndIsResolvedFalseAndDeletedFalse(organizationId, pageable)
                .map(StockLimitAlertResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockLimitAlertResponse> listAlerts(StockAlertSeverity severity, Boolean resolved, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (resolved != null && !resolved) {
            return stockLimitAlertRepository.findByOrganizationIdAndIsResolvedFalseAndDeletedFalse(organizationId, pageable)
                    .map(StockLimitAlertResponse::fromEntity);
        }
        return stockLimitAlertRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(StockLimitAlertResponse::fromEntity);
    }

    @Transactional
    public StockLimitAlertResponse acknowledgeAlert(UUID alertId) {
        return acknowledgeAlert(alertId, null);
    }

    @Transactional
    public StockLimitAlertResponse resolveAlert(UUID alertId) {
        return acknowledgeAlert(alertId, null);
    }

    @Transactional
    public StockLimitAlertResponse acknowledgeAlert(UUID alertId, UUID acknowledgedById) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        StockLimitAlert alert = stockLimitAlertRepository.findByIdAndOrganizationIdAndDeletedFalse(alertId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Оповещение не найдено: " + alertId));

        alert.setAcknowledgedById(currentUserId);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setResolved(true);

        alert = stockLimitAlertRepository.save(alert);
        auditService.logUpdate("StockLimitAlert", alert.getId(), "isResolved", "false", "true");

        log.info("Stock limit alert acknowledged: {} by {} (requestedBy={})", alertId, currentUserId, acknowledgedById);
        return StockLimitAlertResponse.fromEntity(alert);
    }

    private StockLimitAlert createAlert(StockLimit limit, String materialName, BigDecimal currentQuantity,
                                        StockLimitType limitType, StockAlertSeverity severity, UUID organizationId) {
        StockLimitAlert alert = StockLimitAlert.builder()
                .organizationId(organizationId)
                .stockLimitId(limit.getId())
                .materialId(limit.getMaterialId())
                .materialName(materialName)
                .currentQuantity(currentQuantity)
                .limitType(limitType)
                .severity(severity)
                .isResolved(false)
                .build();

        return stockLimitAlertRepository.save(alert);
    }

    private StockLimit getLimitOrThrow(UUID id, UUID organizationId) {
        return stockLimitRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Лимит запаса не найден: " + id));
    }

    private void validateMaterialTenant(UUID materialId, UUID organizationId) {
        materialRepository.findByIdAndOrganizationIdAndDeletedFalse(materialId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Материал не найден: " + materialId));
    }

    private void validateLocationTenant(UUID warehouseLocationId, UUID organizationId) {
        warehouseLocationRepository.findByIdAndOrganizationIdAndDeletedFalse(warehouseLocationId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Складская локация не найдена: " + warehouseLocationId));
    }
}
