package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record PortfolioSummaryDto(
        BigDecimal totalContractValue,
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal totalBudget,
        BigDecimal totalSpent,
        BigDecimal ebitMargin,
        long projectCount,
        long activeProjectCount
) {
}
