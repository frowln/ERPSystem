package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinancialSummaryResponse(
        BigDecimal totalBudget,
        BigDecimal totalSpent,
        BigDecimal totalCommitted,
        BigDecimal totalForecast,
        double marginPercent,
        List<ProjectFinancialEntry> projectFinancials,
        List<MonthlySpendEntry> monthlySpend
) {
    public record ProjectFinancialEntry(
            String projectId,
            String projectName,
            BigDecimal budget,
            BigDecimal spent,
            BigDecimal committed,
            double utilizationPercent
    ) {}

    public record MonthlySpendEntry(
            String month,
            BigDecimal planned,
            BigDecimal actual
    ) {}
}
