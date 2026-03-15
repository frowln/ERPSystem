package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateFinancingScheduleEntryRequest(
        @NotNull(message = "Дата периода обязательна")
        LocalDate periodDate,

        @NotNull(message = "Плановая сумма обязательна")
        BigDecimal plannedAmount,

        BigDecimal actualAmount,
        String description
) {
}
