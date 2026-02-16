package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.JournalType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFinancialJournalRequest(
        @NotBlank(message = "Код журнала обязателен")
        @Size(max = 20)
        String code,

        @NotBlank(message = "Наименование журнала обязательно")
        @Size(max = 500)
        String name,

        @NotNull(message = "Тип журнала обязателен")
        JournalType journalType
) {
}
