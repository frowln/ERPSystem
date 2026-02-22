package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CashFlowForecastBucket;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CashFlowForecastBucketResponse(
        UUID id,
        UUID scenarioId,
        UUID projectId,
        String periodStart,
        String periodEnd,
        BigDecimal forecastIncome,
        BigDecimal forecastExpense,
        BigDecimal forecastNet,
        BigDecimal actualIncome,
        BigDecimal actualExpense,
        BigDecimal actualNet,
        BigDecimal variance,
        BigDecimal cumulativeForecastNet,
        BigDecimal cumulativeActualNet,
        String notes,
        Instant createdAt
) {
    public static CashFlowForecastBucketResponse fromEntity(CashFlowForecastBucket entity) {
        return new CashFlowForecastBucketResponse(
                entity.getId(),
                entity.getScenarioId(),
                entity.getProjectId(),
                entity.getPeriodStart() != null ? entity.getPeriodStart().toString() : null,
                entity.getPeriodEnd() != null ? entity.getPeriodEnd().toString() : null,
                entity.getForecastIncome(),
                entity.getForecastExpense(),
                entity.getForecastNet(),
                entity.getActualIncome(),
                entity.getActualExpense(),
                entity.getActualNet(),
                entity.getVariance(),
                entity.getCumulativeForecastNet(),
                entity.getCumulativeActualNet(),
                entity.getNotes(),
                entity.getCreatedAt()
        );
    }
}
