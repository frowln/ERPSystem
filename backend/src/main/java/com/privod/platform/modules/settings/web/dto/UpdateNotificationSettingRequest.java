package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.EventType;
import com.privod.platform.modules.settings.domain.NotificationType;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationSettingRequest(
        @NotNull(message = "Тип уведомления обязателен")
        NotificationType notificationType,

        @NotNull(message = "Тип события обязателен")
        EventType eventType,

        @NotNull(message = "Статус включения обязателен")
        Boolean isEnabled
) {
}
