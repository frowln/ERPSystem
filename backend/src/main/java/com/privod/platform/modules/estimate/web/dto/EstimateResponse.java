package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EstimateResponse(
        UUID id,
        String name,
        UUID projectId,
        UUID contractId,
        UUID specificationId,
        EstimateStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal orderedAmount,
        BigDecimal invoicedAmount,
        BigDecimal totalSpent,
        BigDecimal balance,
        BigDecimal varianceAmount,
        BigDecimal variancePercent,
        String notes,
        List<EstimateItemResponse> items,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EstimateResponse fromEntity(Estimate estimate) {
        return fromEntity(estimate, null);
    }

    public static EstimateResponse fromEntity(Estimate estimate, List<EstimateItemResponse> items) {
        return new EstimateResponse(
                estimate.getId(),
                estimate.getName(),
                estimate.getProjectId(),
                estimate.getContractId(),
                estimate.getSpecificationId(),
                estimate.getStatus(),
                estimate.getStatus().getDisplayName(),
                estimate.getTotalAmount(),
                estimate.getOrderedAmount(),
                estimate.getInvoicedAmount(),
                estimate.getTotalSpent(),
                estimate.getBalance(),
                estimate.getVarianceAmount(),
                estimate.getVariancePercent(),
                estimate.getNotes(),
                items,
                estimate.getCreatedAt(),
                estimate.getUpdatedAt(),
                estimate.getCreatedBy()
        );
    }
}
