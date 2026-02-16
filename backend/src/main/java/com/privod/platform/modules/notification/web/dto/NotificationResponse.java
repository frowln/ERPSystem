package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.Notification;
import com.privod.platform.modules.notification.domain.NotificationPriority;
import com.privod.platform.modules.notification.domain.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String title,
        String message,
        NotificationType notificationType,
        String notificationTypeDisplayName,
        String sourceModel,
        UUID sourceId,
        boolean isRead,
        Instant readAt,
        String actionUrl,
        NotificationPriority priority,
        String priorityDisplayName,
        Instant expiresAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static NotificationResponse fromEntity(Notification entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getNotificationType(),
                entity.getNotificationType().getDisplayName(),
                entity.getSourceModel(),
                entity.getSourceId(),
                entity.isRead(),
                entity.getReadAt(),
                entity.getActionUrl(),
                entity.getPriority(),
                entity.getPriority().getDisplayName(),
                entity.getExpiresAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
