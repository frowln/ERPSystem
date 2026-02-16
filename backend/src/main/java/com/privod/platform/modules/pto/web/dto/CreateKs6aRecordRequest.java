package com.privod.platform.modules.pto.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateKs6aRecordRequest(
        @NotNull(message = "ID журнала КС-6 обязателен")
        UUID ks6JournalId,

        @NotBlank(message = "Месяц/год обязателен")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "Формат месяца: YYYY-MM")
        String monthYear,

        @NotBlank(message = "Наименование работ обязательно")
        String workName,

        String unit,

        BigDecimal plannedVolume,

        BigDecimal first10days,

        BigDecimal second10days,

        BigDecimal third10days,

        BigDecimal totalActual,

        String notes
) {
}
