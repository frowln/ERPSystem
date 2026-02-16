package com.privod.platform.modules.integration.telegram.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTelegramSubscriptionRequest(
        @NotNull(message = "ID пользователя обязателен")
        UUID userId,

        @NotBlank(message = "ID чата Telegram обязателен")
        @Size(max = 100, message = "ID чата не должен превышать 100 символов")
        String chatId,

        Boolean notifyProjects,
        Boolean notifySafety,
        Boolean notifyTasks,
        Boolean notifyApprovals
) {
}
