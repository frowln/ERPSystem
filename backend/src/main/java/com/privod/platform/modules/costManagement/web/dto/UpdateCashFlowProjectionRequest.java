package com.privod.platform.modules.costManagement.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateCashFlowProjectionRequest(
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal plannedIncome,
        BigDecimal plannedExpense,
        BigDecimal actualIncome,
        BigDecimal actualExpense,
        BigDecimal forecastIncome,
        BigDecimal forecastExpense,
        String notes
) {
}
