package com.privod.platform.modules.integration1c.web.dto;

import com.privod.platform.modules.integration1c.domain.Integration1cSyncLog;
import com.privod.platform.modules.integration1c.domain.SyncDirection;
import com.privod.platform.modules.integration1c.domain.SyncStatus;

import java.time.Instant;
import java.util.UUID;

public record Integration1cSyncLogResponse(
        UUID id,
        UUID configId,
        SyncDirection direction,
        String entityType,
        SyncStatus status,
        int recordsProcessed,
        int recordsErrored,
        String errorMessage,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt
) {
    public static Integration1cSyncLogResponse from(Integration1cSyncLog log) {
        return new Integration1cSyncLogResponse(
                log.getId(),
                log.getConfigId(),
                log.getDirection(),
                log.getEntityType(),
                log.getStatus(),
                log.getRecordsProcessed(),
                log.getRecordsErrored(),
                log.getErrorMessage(),
                log.getStartedAt(),
                log.getCompletedAt(),
                log.getCreatedAt()
        );
    }
}
