package com.privod.platform.modules.estimate.web.dto;

import java.math.BigDecimal;

public record EstimateFinancialSummaryResponse(
        BigDecimal totalAmount,
        BigDecimal orderedAmount,
        BigDecimal invoicedAmount,
        BigDecimal totalSpent,
        BigDecimal balance,
        BigDecimal varianceAmount,
        BigDecimal variancePercent
) {
}
