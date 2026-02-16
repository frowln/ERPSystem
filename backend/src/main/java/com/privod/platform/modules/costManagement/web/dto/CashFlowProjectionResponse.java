package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CashFlowProjection;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CashFlowProjectionResponse(
        UUID id,
        UUID projectId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal plannedIncome,
        BigDecimal plannedExpense,
        BigDecimal actualIncome,
        BigDecimal actualExpense,
        BigDecimal forecastIncome,
        BigDecimal forecastExpense,
        BigDecimal plannedNet,
        BigDecimal actualNet,
        BigDecimal forecastNet,
        BigDecimal cumulativePlannedNet,
        BigDecimal cumulativeActualNet,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CashFlowProjectionResponse fromEntity(CashFlowProjection entity) {
        return new CashFlowProjectionResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getPeriodStart(),
                entity.getPeriodEnd(),
                entity.getPlannedIncome(),
                entity.getPlannedExpense(),
                entity.getActualIncome(),
                entity.getActualExpense(),
                entity.getForecastIncome(),
                entity.getForecastExpense(),
                entity.getPlannedNet(),
                entity.getActualNet(),
                entity.getForecastNet(),
                entity.getCumulativePlannedNet(),
                entity.getCumulativeActualNet(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
