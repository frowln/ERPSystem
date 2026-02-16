package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record CashFlowSummaryResponse(
        BigDecimal totalInflow,
        BigDecimal totalOutflow,
        BigDecimal netCashFlow,
        List<MonthlyCashFlow> monthlyBreakdown
) {

    public record MonthlyCashFlow(
            int year,
            int month,
            BigDecimal inflow,
            BigDecimal outflow,
            BigDecimal net
    ) {
    }
}
