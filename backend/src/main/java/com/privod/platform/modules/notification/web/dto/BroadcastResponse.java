package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.BroadcastNotification;
import com.privod.platform.modules.notification.domain.BroadcastPriority;
import com.privod.platform.modules.notification.domain.BroadcastType;

import java.time.Instant;
import java.util.UUID;

public record BroadcastResponse(
        UUID id,
        UUID organizationId,
        String title,
        String message,
        BroadcastType type,
        String typeDisplayName,
        BroadcastPriority priority,
        String priorityDisplayName,
        UUID createdBy,
        Instant expiresAt,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static BroadcastResponse fromEntity(BroadcastNotification entity) {
        return new BroadcastResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getType(),
                entity.getType().getDisplayName(),
                entity.getPriority(),
                entity.getPriority().getDisplayName(),
                entity.getBroadcastCreatedBy(),
                entity.getExpiresAt(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
