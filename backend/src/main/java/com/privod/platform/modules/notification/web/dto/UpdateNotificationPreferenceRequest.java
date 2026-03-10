package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.NotificationCategory;
import com.privod.platform.modules.notification.domain.NotificationChannel;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferenceRequest(
        @NotNull(message = "Канал уведомления обязателен")
        NotificationChannel channel,

        @NotNull(message = "Категория уведомления обязательна")
        NotificationCategory category,

        @NotNull(message = "Статус включения обязателен")
        Boolean enabled
) {
}
