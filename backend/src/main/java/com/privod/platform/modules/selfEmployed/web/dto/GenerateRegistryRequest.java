package com.privod.platform.modules.selfEmployed.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record GenerateRegistryRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Начало периода обязательно")
        LocalDate periodStart,

        @NotNull(message = "Конец периода обязателен")
        LocalDate periodEnd
) {
}
