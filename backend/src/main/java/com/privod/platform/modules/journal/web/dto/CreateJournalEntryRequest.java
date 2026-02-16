package com.privod.platform.modules.journal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateJournalEntryRequest(
        @NotNull(message = "ID журнала обязателен")
        UUID journalId,

        @NotNull(message = "Дата записи обязательна")
        LocalDate date,

        String section,

        String workDescription,

        BigDecimal volume,

        String unit,

        String crew,

        String weatherConditions,

        String notes
) {
}
