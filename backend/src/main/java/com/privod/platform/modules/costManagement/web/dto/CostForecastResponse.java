package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CostForecast;
import com.privod.platform.modules.costManagement.domain.ForecastMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CostForecastResponse(
        UUID id,
        UUID projectId,
        LocalDate forecastDate,
        ForecastMethod forecastMethod,
        String forecastMethodDisplayName,
        BigDecimal budgetAtCompletion,
        BigDecimal earnedValue,
        BigDecimal plannedValue,
        BigDecimal actualCost,
        BigDecimal estimateAtCompletion,
        BigDecimal estimateToComplete,
        BigDecimal varianceAtCompletion,
        BigDecimal costPerformanceIndex,
        BigDecimal schedulePerformanceIndex,
        BigDecimal costVariance,
        BigDecimal scheduleVariance,
        BigDecimal percentComplete,
        String notes,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CostForecastResponse fromEntity(CostForecast entity) {
        return new CostForecastResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getForecastDate(),
                entity.getForecastMethod(),
                entity.getForecastMethod() != null ? entity.getForecastMethod().getDisplayName() : null,
                entity.getBudgetAtCompletion(),
                entity.getEarnedValue(),
                entity.getPlannedValue(),
                entity.getActualCost(),
                entity.getEstimateAtCompletion(),
                entity.getEstimateToComplete(),
                entity.getVarianceAtCompletion(),
                entity.getCostPerformanceIndex(),
                entity.getSchedulePerformanceIndex(),
                entity.getCostVariance(),
                entity.getScheduleVariance(),
                entity.getPercentComplete(),
                entity.getNotes(),
                entity.getCreatedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
