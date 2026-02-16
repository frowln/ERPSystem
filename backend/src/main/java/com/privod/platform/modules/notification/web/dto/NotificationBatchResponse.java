package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.BatchStatus;
import com.privod.platform.modules.notification.domain.NotificationBatch;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.domain.TargetType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationBatchResponse(
        UUID id,
        String title,
        String message,
        NotificationType notificationType,
        String notificationTypeDisplayName,
        TargetType targetType,
        String targetTypeDisplayName,
        Map<String, Object> targetFilter,
        int sentCount,
        UUID createdById,
        BatchStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static NotificationBatchResponse fromEntity(NotificationBatch entity) {
        return new NotificationBatchResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getNotificationType(),
                entity.getNotificationType().getDisplayName(),
                entity.getTargetType(),
                entity.getTargetType().getDisplayName(),
                entity.getTargetFilter(),
                entity.getSentCount(),
                entity.getCreatedById(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
