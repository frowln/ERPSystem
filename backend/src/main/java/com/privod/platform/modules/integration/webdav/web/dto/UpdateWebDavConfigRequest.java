package com.privod.platform.modules.integration.webdav.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateWebDavConfigRequest(
        @NotBlank(message = "URL сервера обязателен")
        @Size(max = 1000, message = "URL сервера не должен превышать 1000 символов")
        String serverUrl,

        @NotBlank(message = "Имя пользователя обязательно")
        @Size(max = 255, message = "Имя пользователя не должно превышать 255 символов")
        String username,

        String password,

        @Size(max = 500, message = "Базовый путь не должен превышать 500 символов")
        String basePath,

        boolean enabled,

        @Min(value = 1, message = "Максимальный размер файла не может быть менее 1 МБ")
        @Max(value = 5000, message = "Максимальный размер файла не может превышать 5000 МБ")
        int maxFileSizeMb,

        UUID organizationId
) {
}
