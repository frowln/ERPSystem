package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.ProfitabilityForecast;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProfitabilityForecastResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String projectName,
        BigDecimal contractAmount,
        BigDecimal originalBudget,
        BigDecimal revisedBudget,
        BigDecimal actualCostToDate,
        BigDecimal earnedValueToDate,
        BigDecimal estimateAtCompletion,
        BigDecimal estimateToComplete,
        BigDecimal forecastMargin,
        BigDecimal forecastMarginPercent,
        BigDecimal originalMargin,
        BigDecimal profitFadeAmount,
        BigDecimal profitFadePercent,
        BigDecimal wipAmount,
        BigDecimal overBillingAmount,
        BigDecimal underBillingAmount,
        BigDecimal completionPercent,
        String riskLevel,
        String riskLevelDisplayName,
        LocalDateTime lastCalculatedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ProfitabilityForecastResponse fromEntity(ProfitabilityForecast entity) {
        return new ProfitabilityForecastResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getProjectName(),
                entity.getContractAmount(),
                entity.getOriginalBudget(),
                entity.getRevisedBudget(),
                entity.getActualCostToDate(),
                entity.getEarnedValueToDate(),
                entity.getEstimateAtCompletion(),
                entity.getEstimateToComplete(),
                entity.getForecastMargin(),
                entity.getForecastMarginPercent(),
                entity.getOriginalMargin(),
                entity.getProfitFadeAmount(),
                entity.getProfitFadePercent(),
                entity.getWipAmount(),
                entity.getOverBillingAmount(),
                entity.getUnderBillingAmount(),
                entity.getCompletionPercent(),
                entity.getRiskLevel() != null ? entity.getRiskLevel().name() : null,
                entity.getRiskLevel() != null ? entity.getRiskLevel().getDisplayName() : null,
                entity.getLastCalculatedAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
