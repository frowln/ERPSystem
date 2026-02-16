package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.domain.StockLimitAlert;
import com.privod.platform.modules.warehouse.domain.StockLimitType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record StockLimitAlertResponse(
        UUID id,
        UUID stockLimitId,
        UUID materialId,
        String materialName,
        BigDecimal currentQuantity,
        StockLimitType limitType,
        String limitTypeDisplayName,
        StockAlertSeverity severity,
        String severityDisplayName,
        UUID acknowledgedById,
        LocalDateTime acknowledgedAt,
        boolean isResolved,
        Instant createdAt,
        Instant updatedAt
) {
    public static StockLimitAlertResponse fromEntity(StockLimitAlert entity) {
        return new StockLimitAlertResponse(
                entity.getId(),
                entity.getStockLimitId(),
                entity.getMaterialId(),
                entity.getMaterialName(),
                entity.getCurrentQuantity(),
                entity.getLimitType(),
                entity.getLimitType().getDisplayName(),
                entity.getSeverity(),
                entity.getSeverity().getDisplayName(),
                entity.getAcknowledgedById(),
                entity.getAcknowledgedAt(),
                entity.isResolved(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
