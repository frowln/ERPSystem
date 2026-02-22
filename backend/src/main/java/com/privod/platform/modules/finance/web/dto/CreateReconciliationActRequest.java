package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateReconciliationActRequest(
        @NotBlank(message = "Номер акта обязателен")
        @Size(max = 50, message = "Номер акта не должен превышать 50 символов")
        String actNumber,

        @NotNull(message = "ID контрагента обязателен")
        UUID counterpartyId,

        UUID contractId,

        @NotNull(message = "Начало периода обязательно")
        LocalDate periodStart,

        @NotNull(message = "Конец периода обязателен")
        LocalDate periodEnd,

        BigDecimal ourDebit,
        BigDecimal ourCredit,
        BigDecimal counterpartyDebit,
        BigDecimal counterpartyCredit,

        String notes
) {
}
