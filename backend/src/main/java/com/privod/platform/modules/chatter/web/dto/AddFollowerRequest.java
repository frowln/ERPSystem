package com.privod.platform.modules.chatter.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AddFollowerRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType,

        @NotNull(message = "Идентификатор сущности обязателен")
        UUID entityId,

        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @Size(max = 255, message = "Причина подписки не должна превышать 255 символов")
        String followReason
) {
}
