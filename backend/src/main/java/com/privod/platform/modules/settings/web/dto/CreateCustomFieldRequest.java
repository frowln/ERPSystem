package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCustomFieldRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 50, message = "Тип сущности не должен превышать 50 символов")
        String entityType,

        @NotBlank(message = "Название поля обязательно")
        @Size(max = 255, message = "Название поля не должно превышать 255 символов")
        String fieldName,

        @NotNull(message = "Тип поля обязателен")
        String fieldType,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        Boolean required,

        Boolean searchable,

        List<String> options,

        String defaultValue,

        @Size(max = 500, message = "Регулярное выражение не должно превышать 500 символов")
        String validationRegex
) {
}
