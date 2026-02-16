package com.privod.platform.modules.apiManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateApiKeyRequest(
        @NotBlank(message = "Название API ключа обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        String scopes,

        Instant expiresAt,

        Integer rateLimit
) {
}
