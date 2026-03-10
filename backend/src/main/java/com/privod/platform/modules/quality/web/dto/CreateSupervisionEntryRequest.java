package com.privod.platform.modules.quality.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSupervisionEntryRequest(
        @NotNull(message = "Дата записи обязательна")
        LocalDate date,

        @NotBlank(message = "ФИО инспектора обязательно")
        String inspectorName,

        String workType,

        String remarks,

        String directives,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId
) {
}
