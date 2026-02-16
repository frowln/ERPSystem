package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.domain.SyncJob;
import com.privod.platform.modules.integration.domain.SyncJobStatus;
import com.privod.platform.modules.integration.domain.SyncType;

import java.time.Instant;
import java.util.UUID;

public record SyncJobResponse(
        UUID id,
        String code,
        UUID endpointId,
        SyncType syncType,
        String syncTypeDisplayName,
        SyncDirection direction,
        String directionDisplayName,
        String entityType,
        SyncJobStatus status,
        String statusDisplayName,
        Instant startedAt,
        Instant completedAt,
        int processedCount,
        int errorCount,
        String errorLog,
        String lastSyncCursor,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SyncJobResponse fromEntity(SyncJob entity) {
        return new SyncJobResponse(
                entity.getId(),
                entity.getCode(),
                entity.getEndpointId(),
                entity.getSyncType(),
                entity.getSyncType().getDisplayName(),
                entity.getDirection(),
                entity.getDirection().getDisplayName(),
                entity.getEntityType(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getProcessedCount(),
                entity.getErrorCount(),
                entity.getErrorLog(),
                entity.getLastSyncCursor(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
