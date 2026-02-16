package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record CreateBimElementRequest(
        @NotNull(message = "Идентификатор модели обязателен")
        UUID modelId,

        @NotBlank(message = "Идентификатор элемента обязателен")
        @Size(max = 255, message = "Идентификатор элемента не должен превышать 255 символов")
        String elementId,

        @NotBlank(message = "IFC тип обязателен")
        @Size(max = 255, message = "IFC тип не должен превышать 255 символов")
        String ifcType,

        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        Map<String, Object> properties,
        Map<String, Object> geometry,
        String floor,
        String zone
) {
}
