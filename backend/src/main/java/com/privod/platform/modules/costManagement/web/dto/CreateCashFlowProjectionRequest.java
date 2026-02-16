package com.privod.platform.modules.costManagement.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCashFlowProjectionRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата начала периода обязательна")
        LocalDate periodStart,

        @NotNull(message = "Дата окончания периода обязательна")
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
