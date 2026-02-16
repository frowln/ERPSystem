package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EstimateListResponse(
        UUID id,
        String name,
        UUID projectId,
        UUID specificationId,
        EstimateStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal orderedAmount,
        BigDecimal totalSpent,
        Instant createdAt,
        Instant updatedAt
) {
    public static EstimateListResponse fromEntity(Estimate estimate) {
        return new EstimateListResponse(
                estimate.getId(),
                estimate.getName(),
                estimate.getProjectId(),
                estimate.getSpecificationId(),
                estimate.getStatus(),
                estimate.getStatus().getDisplayName(),
                estimate.getTotalAmount(),
                estimate.getOrderedAmount(),
                estimate.getTotalSpent(),
                estimate.getCreatedAt(),
                estimate.getUpdatedAt()
        );
    }
}
