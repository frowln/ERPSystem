package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.SyncDirection;

import java.time.Instant;
import java.util.UUID;

public record OneCConfigResponse(
        UUID id,
        String name,
        String baseUrl,
        String username,
        String databaseName,
        SyncDirection syncDirection,
        String syncDirectionDisplayName,
        boolean isActive,
        Instant lastSyncAt,
        int syncIntervalMinutes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static OneCConfigResponse fromEntity(OneCConfig entity) {
        return new OneCConfigResponse(
                entity.getId(),
                entity.getName(),
                entity.getBaseUrl(),
                entity.getUsername(),
                entity.getDatabaseName(),
                entity.getSyncDirection(),
                entity.getSyncDirection().getDisplayName(),
                entity.isActive(),
                entity.getLastSyncAt(),
                entity.getSyncIntervalMinutes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
