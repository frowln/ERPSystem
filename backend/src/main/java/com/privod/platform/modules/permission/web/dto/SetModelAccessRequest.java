package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SetModelAccessRequest(
        @NotBlank(message = "Имя модели обязательно")
        @Size(max = 100, message = "Имя модели не должно превышать 100 символов")
        String modelName,

        @NotNull(message = "ID группы обязателен")
        UUID groupId,

        boolean canRead,
        boolean canCreate,
        boolean canUpdate,
        boolean canDelete
) {
}
