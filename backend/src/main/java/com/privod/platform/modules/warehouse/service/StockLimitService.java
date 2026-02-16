package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockLimit;
import com.privod.platform.modules.warehouse.domain.StockLimitAlert;
import com.privod.platform.modules.warehouse.domain.StockLimitType;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitAlertRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitRepository;
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
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StockLimitResponse> listLimits(UUID materialId, UUID warehouseLocationId, Pageable pageable) {
        if (materialId != null) {
            return stockLimitRepository.findByMaterialIdAndDeletedFalse(materialId, pageable)
                    .map(StockLimitResponse::fromEntity);
        }
        if (warehouseLocationId != null) {
            return stockLimitRepository.findByWarehouseLocationIdAndDeletedFalse(warehouseLocationId, pageable)
                    .map(StockLimitResponse::fromEntity);
        }
        return stockLimitRepository.findByDeletedFalse(pageable)
                .map(StockLimitResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public StockLimitResponse getLimit(UUID id) {
        StockLimit limit = getLimitOrThrow(id);
        return StockLimitResponse.fromEntity(limit);
    }

    @Transactional
    public StockLimitResponse createLimit(CreateStockLimitRequest request) {
        StockLimit limit = StockLimit.builder()
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
        StockLimit limit = getLimitOrThrow(id);

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
        StockLimit limit = getLimitOrThrow(id);
        limit.softDelete();
        stockLimitRepository.save(limit);
        auditService.logDelete("StockLimit", limit.getId());

        log.info("Stock limit deleted: {}", id);
    }

    @Transactional
    public List<StockLimitAlertResponse> checkLimits() {
        List<StockLimit> activeLimits = stockLimitRepository.findByIsActiveTrueAndDeletedFalse();
        List<StockLimitAlertResponse> newAlerts = new ArrayList<>();

        for (StockLimit limit : activeLimits) {
            Optional<StockEntry> entryOpt = stockEntryRepository
                    .findByMaterialIdAndLocationIdAndDeletedFalse(limit.getMaterialId(), limit.getWarehouseLocationId());

            BigDecimal currentQty = entryOpt.map(StockEntry::getQuantity).orElse(BigDecimal.ZERO);
            String materialName = entryOpt.map(StockEntry::getMaterialName).orElse(null);

            // Check below minimum
            if (limit.getMinQuantity() != null && currentQty.compareTo(limit.getMinQuantity()) < 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.BELOW_MIN, StockAlertSeverity.CRITICAL);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
            }

            // Check above maximum
            if (limit.getMaxQuantity() != null && currentQty.compareTo(limit.getMaxQuantity()) > 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.ABOVE_MAX, StockAlertSeverity.WARNING);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
            }

            // Check reorder point
            if (limit.getReorderPoint() != null && currentQty.compareTo(limit.getReorderPoint()) <= 0) {
                StockLimitAlert alert = createAlert(limit, materialName, currentQty,
                        StockLimitType.REORDER_POINT, StockAlertSeverity.INFO);
                newAlerts.add(StockLimitAlertResponse.fromEntity(alert));
            }

            if (!newAlerts.isEmpty()) {
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
        return stockLimitAlertRepository.findByIsResolvedFalseAndDeletedFalse(pageable)
                .map(StockLimitAlertResponse::fromEntity);
    }

    @Transactional
    public StockLimitAlertResponse acknowledgeAlert(UUID alertId, UUID acknowledgedById) {
        StockLimitAlert alert = stockLimitAlertRepository.findById(alertId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оповещение не найдено: " + alertId));

        alert.setAcknowledgedById(acknowledgedById);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setResolved(true);

        alert = stockLimitAlertRepository.save(alert);
        auditService.logUpdate("StockLimitAlert", alert.getId(), "isResolved", "false", "true");

        log.info("Stock limit alert acknowledged: {} by {}", alertId, acknowledgedById);
        return StockLimitAlertResponse.fromEntity(alert);
    }

    private StockLimitAlert createAlert(StockLimit limit, String materialName, BigDecimal currentQuantity,
                                         StockLimitType limitType, StockAlertSeverity severity) {
        StockLimitAlert alert = StockLimitAlert.builder()
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

    private StockLimit getLimitOrThrow(UUID id) {
        return stockLimitRepository.findById(id)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Лимит запаса не найден: " + id));
    }
}
