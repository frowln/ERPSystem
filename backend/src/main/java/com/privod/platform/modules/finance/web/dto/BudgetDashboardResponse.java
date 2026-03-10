package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record BudgetDashboardResponse(
        BigDecimal totalRevenue,
        BigDecimal totalCost,
        BigDecimal margin,
        BigDecimal marginPercent,
        long itemCount,
        long completedItems
) {
}
