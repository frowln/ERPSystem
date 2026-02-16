package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockLimit;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record StockLimitResponse(
        UUID id,
        UUID materialId,
        UUID warehouseLocationId,
        BigDecimal minQuantity,
        BigDecimal maxQuantity,
        BigDecimal reorderPoint,
        BigDecimal reorderQuantity,
        String unit,
        boolean isActive,
        LocalDateTime lastAlertAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static StockLimitResponse fromEntity(StockLimit entity) {
        return new StockLimitResponse(
                entity.getId(),
                entity.getMaterialId(),
                entity.getWarehouseLocationId(),
                entity.getMinQuantity(),
                entity.getMaxQuantity(),
                entity.getReorderPoint(),
                entity.getReorderQuantity(),
                entity.getUnit(),
                entity.isActive(),
                entity.getLastAlertAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
