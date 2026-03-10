package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record BudgetMonthlyDistributionResponse(
        String month,
        BigDecimal plannedCost,
        BigDecimal actualCost,
        BigDecimal plannedRevenue,
        BigDecimal actualRevenue
) {
}
