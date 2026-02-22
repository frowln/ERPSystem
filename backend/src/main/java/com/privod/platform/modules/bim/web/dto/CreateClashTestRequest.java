package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateClashTestRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название теста обязательно")
        String name,

        String description,

        @NotNull(message = "Идентификатор модели A обязателен")
        UUID modelAId,

        @NotNull(message = "Идентификатор модели B обязателен")
        UUID modelBId,

        Double toleranceMm
) {
}
