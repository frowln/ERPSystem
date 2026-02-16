package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePhotoComparisonRequest(
        @NotNull(message = "Идентификатор фото 'до' обязателен")
        UUID beforePhotoId,

        @NotNull(message = "Идентификатор фото 'после' обязателен")
        UUID afterPhotoId,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название сравнения обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description
) {
}
