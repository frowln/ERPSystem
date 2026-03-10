package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.NotificationEventEntity;

import java.time.Instant;
import java.util.UUID;

public record NotificationEventResponse(
        UUID id,
        UUID userId,
        String type,
        String title,
        String message,
        String entityType,
        UUID entityId,
        UUID projectId,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationEventResponse fromEntity(NotificationEventEntity entity) {
        return new NotificationEventResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getProjectId(),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }
}
