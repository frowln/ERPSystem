package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.NotificationPriority;
import com.privod.platform.modules.notification.domain.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record SendNotificationRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @NotBlank(message = "Заголовок уведомления обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @NotBlank(message = "Сообщение уведомления обязательно")
        String message,

        @NotNull(message = "Тип уведомления обязателен")
        NotificationType notificationType,

        String sourceModel,
        UUID sourceId,

        @Size(max = 1000, message = "URL действия не должен превышать 1000 символов")
        String actionUrl,

        NotificationPriority priority,
        Instant expiresAt
) {
}
