package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RevenueRecognitionPeriodResponse(
        UUID id,
        UUID revenueContractId,
        LocalDate periodStart,
        LocalDate periodEnd,
        PeriodStatus status,
        String statusDisplayName,
        BigDecimal cumulativeCostIncurred,
        BigDecimal cumulativeRevenueRecognized,
        BigDecimal periodCostIncurred,
        BigDecimal periodRevenueRecognized,
        BigDecimal percentComplete,
        BigDecimal estimateCostToComplete,
        BigDecimal expectedProfit,
        BigDecimal expectedLoss,
        BigDecimal adjustmentAmount,
        String notes,
        UUID calculatedById,
        UUID reviewedById,
        UUID postedById,
        Instant postedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RevenueRecognitionPeriodResponse fromEntity(RevenueRecognitionPeriod entity) {
        return new RevenueRecognitionPeriodResponse(
                entity.getId(),
                entity.getRevenueContractId(),
                entity.getPeriodStart(),
                entity.getPeriodEnd(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCumulativeCostIncurred(),
                entity.getCumulativeRevenueRecognized(),
                entity.getPeriodCostIncurred(),
                entity.getPeriodRevenueRecognized(),
                entity.getPercentComplete(),
                entity.getEstimateCostToComplete(),
                entity.getExpectedProfit(),
                entity.getExpectedLoss(),
                entity.getAdjustmentAmount(),
                entity.getNotes(),
                entity.getCalculatedById(),
                entity.getReviewedById(),
                entity.getPostedById(),
                entity.getPostedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
