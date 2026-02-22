package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSavedViewRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название представления обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,

        UUID modelId,

        @Size(max = 200, message = "Фильтр этажа не должен превышать 200 символов")
        String filterFloor,

        @Size(max = 200, message = "Фильтр системы не должен превышать 200 символов")
        String filterSystem,

        @Size(max = 30, message = "Фильтр статуса не должен превышать 30 символов")
        String filterDefectStatus,

        String cameraPresetJson,
        String elementGuidsJson,
        Boolean isShared
) {
}
