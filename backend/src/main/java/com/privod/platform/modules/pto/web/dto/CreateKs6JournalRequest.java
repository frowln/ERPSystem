package com.privod.platform.modules.pto.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateKs6JournalRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        UUID responsibleEngineerId,

        String notes
) {
}
