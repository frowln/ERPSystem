package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record FinancialBarResponse(
        String month,
        BigDecimal revenue,
        BigDecimal cost,
        BigDecimal profit
) {
}
