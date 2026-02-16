package com.privod.platform.modules.integration.telegram.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateTelegramConfigRequest(
        @NotBlank(message = "Токен бота обязателен")
        @Size(max = 512, message = "Токен бота не должен превышать 512 символов")
        String botToken,

        @NotBlank(message = "Имя пользователя бота обязательно")
        @Size(max = 255, message = "Имя пользователя бота не должно превышать 255 символов")
        String botUsername,

        @Size(max = 1000, message = "URL вебхука не должен превышать 1000 символов")
        String webhookUrl,

        Boolean enabled,

        @Size(max = 2000, message = "Список ID чатов не должен превышать 2000 символов")
        String chatIds,

        @NotNull(message = "ID организации обязателен")
        UUID organizationId
) {
}
