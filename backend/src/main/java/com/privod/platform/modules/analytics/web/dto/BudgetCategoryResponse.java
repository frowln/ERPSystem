package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record BudgetCategoryResponse(
        String name,
        BigDecimal amount,
        String color
) {
}
