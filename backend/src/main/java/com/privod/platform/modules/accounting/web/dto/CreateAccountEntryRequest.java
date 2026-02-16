package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAccountEntryRequest(
        @NotNull(message = "ID журнала обязателен")
        UUID journalId,

        @NotNull(message = "ID счёта по дебету обязателен")
        UUID debitAccountId,

        @NotNull(message = "ID счёта по кредиту обязателен")
        UUID creditAccountId,

        @NotNull(message = "Сумма обязательна")
        @DecimalMin(value = "0.01", message = "Сумма должна быть больше 0")
        BigDecimal amount,

        @NotNull(message = "Дата проводки обязательна")
        LocalDate entryDate,

        String description,
        String documentType,
        UUID documentId,

        @NotNull(message = "ID периода обязателен")
        UUID periodId
) {
}
