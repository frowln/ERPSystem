package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.OfflineAction;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import com.privod.platform.modules.mobile.domain.OfflineActionType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OfflineActionResponse(
        UUID id,
        UUID userId,
        UUID deviceId,
        OfflineActionType actionType,
        String actionTypeDisplayName,
        String entityType,
        UUID entityId,
        Map<String, Object> payload,
        Instant syncedAt,
        OfflineActionStatus status,
        String statusDisplayName,
        String conflictResolution,
        Instant createdAt
) {
    public static OfflineActionResponse fromEntity(OfflineAction entity) {
        return new OfflineActionResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getDeviceId(),
                entity.getActionType(),
                entity.getActionType().getDisplayName(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getPayload(),
                entity.getSyncedAt(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getConflictResolution(),
                entity.getCreatedAt()
        );
    }
}
