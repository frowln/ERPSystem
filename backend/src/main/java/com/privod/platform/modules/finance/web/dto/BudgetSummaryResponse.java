package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record BudgetSummaryResponse(
        long totalBudgets,
        BigDecimal totalPlannedRevenue,
        BigDecimal totalPlannedCost,
        BigDecimal totalActualRevenue,
        BigDecimal totalActualCost
) {
}
