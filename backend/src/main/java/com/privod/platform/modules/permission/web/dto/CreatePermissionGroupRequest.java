package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePermissionGroupRequest(
        @NotBlank(message = "Название группы обязательно")
        @Size(max = 100, message = "Название группы не должно превышать 100 символов")
        String name,

        @NotBlank(message = "Отображаемое имя обязательно")
        @Size(max = 200, message = "Отображаемое имя не должно превышать 200 символов")
        String displayName,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @NotBlank(message = "Категория обязательна")
        @Size(max = 100, message = "Категория не должна превышать 100 символов")
        String category,

        UUID parentGroupId,

        Integer sequence
) {
}
