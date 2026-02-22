package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDefectBimLinkRequest(
        @NotNull(message = "Идентификатор дефекта обязателен")
        UUID defectId,

        @NotNull(message = "Идентификатор BIM модели обязателен")
        UUID modelId,

        @NotBlank(message = "GUID элемента обязателен")
        @Size(max = 255, message = "GUID элемента не должен превышать 255 символов")
        String elementGuid,

        @Size(max = 500, message = "Название элемента не должно превышать 500 символов")
        String elementName,

        @Size(max = 200, message = "Тип элемента не должен превышать 200 символов")
        String elementType,

        @Size(max = 200, message = "Название этажа не должно превышать 200 символов")
        String floorName,

        @Size(max = 200, message = "Название системы не должно превышать 200 символов")
        String systemName,

        Double pinX,
        Double pinY,
        Double pinZ,
        String cameraPositionJson,

        @Size(max = 1000, message = "URL скриншота не должен превышать 1000 символов")
        String screenshotUrl,

        String notes
) {
}
