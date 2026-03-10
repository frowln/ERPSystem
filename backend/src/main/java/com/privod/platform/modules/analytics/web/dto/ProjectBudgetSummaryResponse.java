package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record ProjectBudgetSummaryResponse(
        String name,
        BigDecimal budget,
        BigDecimal actual
) {
}
