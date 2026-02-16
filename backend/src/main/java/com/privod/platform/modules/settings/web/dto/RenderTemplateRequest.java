package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record RenderTemplateRequest(
        @NotBlank(message = "Код шаблона обязателен")
        String code,

        @NotNull(message = "Переменные шаблона обязательны")
        Map<String, String> variables
) {
}
