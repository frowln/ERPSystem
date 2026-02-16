package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetResponse(
        UUID id,
        String name,
        UUID projectId,
        String projectName,
        UUID contractId,
        BudgetStatus status,
        String statusDisplayName,
        BigDecimal plannedRevenue,
        BigDecimal plannedCost,
        BigDecimal plannedMargin,
        BigDecimal actualRevenue,
        BigDecimal actualCost,
        BigDecimal actualMargin,
        BigDecimal revenueVariance,
        BigDecimal costVariance,
        BigDecimal marginVariance,
        BigDecimal revenueVariancePercent,
        BigDecimal costVariancePercent,
        Integer docVersion,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BudgetResponse fromEntity(Budget budget) {
        return fromEntity(budget, null);
    }

    public static BudgetResponse fromEntity(Budget budget, String projectName) {
        return new BudgetResponse(
                budget.getId(),
                budget.getName(),
                budget.getProjectId(),
                projectName,
                budget.getContractId(),
                budget.getStatus(),
                budget.getStatus().getDisplayName(),
                budget.getPlannedRevenue(),
                budget.getPlannedCost(),
                budget.getPlannedMargin(),
                budget.getActualRevenue(),
                budget.getActualCost(),
                budget.getActualMargin(),
                budget.getRevenueVariance(),
                budget.getCostVariance(),
                budget.getMarginVariance(),
                budget.getRevenueVariancePercent(),
                budget.getCostVariancePercent(),
                budget.getDocVersion(),
                budget.getNotes(),
                budget.getCreatedAt(),
                budget.getUpdatedAt(),
                budget.getCreatedBy()
        );
    }
}
