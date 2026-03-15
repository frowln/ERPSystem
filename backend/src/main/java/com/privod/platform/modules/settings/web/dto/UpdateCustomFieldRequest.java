package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateCustomFieldRequest(
        @Size(max = 255, message = "Название поля не должно превышать 255 символов")
        String fieldName,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        Boolean required,

        Boolean searchable,

        Integer sortOrder,

        List<String> options,

        String defaultValue,

        @Size(max = 500, message = "Регулярное выражение не должно превышать 500 символов")
        String validationRegex
) {
}
