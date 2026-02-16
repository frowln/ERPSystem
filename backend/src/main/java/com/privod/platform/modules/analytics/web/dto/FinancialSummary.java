package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record FinancialSummary(
        BigDecimal totalRevenue,
        BigDecimal totalCosts,
        BigDecimal margin,
        BigDecimal marginPercent,
        BigDecimal cashFlow,
        BigDecimal totalBudget,
        BigDecimal budgetUtilization
) {
}
