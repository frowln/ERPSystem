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
        String position,
        String sectionName,
        SpecItemType itemType,
        String itemTypeDisplayName,
        String name,
        String brand,
        String productCode,
        String manufacturer,
        BigDecimal quantity,
        String unitOfMeasure,
        BigDecimal weight,
        BigDecimal plannedAmount,
        String notes,
        String procurementStatus,
        String estimateStatus,
        boolean isCustomerProvided,
        UUID budgetItemId,
        Instant createdAt,
        Instant updatedAt
) {
    public static SpecItemResponse fromEntity(SpecItem item) {
        return new SpecItemResponse(
                item.getId(),
                item.getSpecificationId(),
                item.getSequence(),
                item.getPosition(),
                item.getSectionName(),
                item.getItemType(),
                item.getItemType().getDisplayName(),
                item.getName(),
                item.getBrand(),
                item.getProductCode(),
                item.getManufacturer(),
                item.getQuantity(),
                item.getUnitOfMeasure(),
                item.getWeight(),
                item.getPlannedAmount(),
                item.getNotes(),
                item.getProcurementStatus(),
                item.getEstimateStatus(),
                item.isCustomerProvided(),
                item.getBudgetItemId(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
