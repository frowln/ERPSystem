package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SpecItemResponse(
        UUID id,
        UUID specificationId,
        Integer sequence,
        SpecItemType itemType,
        String itemTypeDisplayName,
        String name,
        String productCode,
        BigDecimal quantity,
        String unitOfMeasure,
        BigDecimal plannedAmount,
        String notes,
        String procurementStatus,
        String estimateStatus,
        boolean isCustomerProvided,
        Instant createdAt,
        Instant updatedAt
) {
    public static SpecItemResponse fromEntity(SpecItem item) {
        return new SpecItemResponse(
                item.getId(),
                item.getSpecificationId(),
                item.getSequence(),
                item.getItemType(),
                item.getItemType().getDisplayName(),
                item.getName(),
                item.getProductCode(),
                item.getQuantity(),
                item.getUnitOfMeasure(),
                item.getPlannedAmount(),
                item.getNotes(),
                item.getProcurementStatus(),
                item.getEstimateStatus(),
                item.isCustomerProvided(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
