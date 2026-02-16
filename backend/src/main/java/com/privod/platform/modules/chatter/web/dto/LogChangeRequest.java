package com.privod.platform.modules.chatter.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record LogChangeRequest(
        @NotBlank(message = "Тип сущности обязателен")
        String entityType,

        @NotNull(message = "Идентификатор сущности обязателен")
        UUID entityId,

        @NotBlank(message = "Имя поля обязательно")
        @Size(max = 255, message = "Имя поля не должно превышать 255 символов")
        String fieldName,

        String oldValue,
        String newValue,

        @NotNull(message = "Идентификатор автора изменения обязателен")
        UUID changedById
) {
}
