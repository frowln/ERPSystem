package com.privod.platform.modules.selfEmployed.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRegistryRequest(
        @NotBlank(message = "Наименование реестра обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Начало периода обязательно")
        LocalDate periodStart,

        @NotNull(message = "Конец периода обязателен")
        LocalDate periodEnd
) {
}
