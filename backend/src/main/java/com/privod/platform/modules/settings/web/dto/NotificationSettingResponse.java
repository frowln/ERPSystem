package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.EventType;
import com.privod.platform.modules.settings.domain.NotificationSetting;
import com.privod.platform.modules.settings.domain.NotificationType;

import java.util.UUID;

public record NotificationSettingResponse(
        UUID id,
        UUID userId,
        NotificationType notificationType,
        String notificationTypeDisplayName,
        EventType eventType,
        String eventTypeDisplayName,
        boolean isEnabled
) {
    public static NotificationSettingResponse fromEntity(NotificationSetting setting) {
        return new NotificationSettingResponse(
                setting.getId(),
                setting.getUserId(),
                setting.getNotificationType(),
                setting.getNotificationType().getDisplayName(),
                setting.getEventType(),
                setting.getEventType().getDisplayName(),
                setting.isEnabled()
        );
    }
}
