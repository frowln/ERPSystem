package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailNotification;
import com.privod.platform.modules.messaging.domain.MailNotificationStatus;
import com.privod.platform.modules.messaging.domain.MailNotificationType;

import java.time.Instant;
import java.util.UUID;

public record MailNotificationResponse(
        UUID id,
        UUID messageId,
        UUID userId,
        boolean isRead,
        Instant readAt,
        MailNotificationType notificationType,
        String notificationTypeDisplayName,
        MailNotificationStatus status,
        String statusDisplayName,
        String failureType,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailNotificationResponse fromEntity(MailNotification notification) {
        return new MailNotificationResponse(
                notification.getId(),
                notification.getMessageId(),
                notification.getUserId(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getNotificationType(),
                notification.getNotificationType().getDisplayName(),
                notification.getStatus(),
                notification.getStatus().getDisplayName(),
                notification.getFailureType(),
                notification.getCreatedAt(),
                notification.getUpdatedAt()
        );
    }
}
