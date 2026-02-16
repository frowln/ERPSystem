package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ChangeOrderItemResponse(
        UUID id,
        UUID changeOrderId,
        String description,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        UUID costCodeId,
        UUID wbsNodeId,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChangeOrderItemResponse fromEntity(ChangeOrderItem entity) {
        return new ChangeOrderItemResponse(
                entity.getId(),
                entity.getChangeOrderId(),
                entity.getDescription(),
                entity.getQuantity(),
                entity.getUnit(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getCostCodeId(),
                entity.getWbsNodeId(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
