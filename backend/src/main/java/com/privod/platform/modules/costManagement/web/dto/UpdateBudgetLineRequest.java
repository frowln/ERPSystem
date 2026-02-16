package com.privod.platform.modules.costManagement.web.dto;

import java.math.BigDecimal;

public record UpdateBudgetLineRequest(
        String description,
        BigDecimal originalBudget,
        BigDecimal approvedChanges,
        BigDecimal committedCost,
        BigDecimal actualCost,
        BigDecimal forecastFinalCost
) {
}
