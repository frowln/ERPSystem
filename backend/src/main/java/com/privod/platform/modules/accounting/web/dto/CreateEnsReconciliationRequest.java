package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEnsReconciliationRequest(
        @NotNull(message = "ID счёта ЕНС обязателен")
        UUID ensAccountId,

        @NotNull(message = "Начало периода обязательно")
        LocalDate periodStart,

        @NotNull(message = "Конец периода обязателен")
        LocalDate periodEnd,

        BigDecimal openingBalance,

        BigDecimal totalDebits,

        BigDecimal totalCredits,

        BigDecimal closingBalance,

        String notes
) {
}
