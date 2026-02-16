package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.OneCExchangeLog;
import com.privod.platform.modules.integration.domain.OneCExchangeStatus;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.domain.SyncDirection;

import java.time.Instant;
import java.util.UUID;

public record OneCExchangeLogResponse(
        UUID id,
        UUID configId,
        OneCExchangeType exchangeType,
        String exchangeTypeDisplayName,
        SyncDirection direction,
        String directionDisplayName,
        OneCExchangeStatus status,
        String statusDisplayName,
        Instant startedAt,
        Instant completedAt,
        int recordsProcessed,
        int recordsFailed,
        String errorMessage,
        String details,
        Instant createdAt
) {
    public static OneCExchangeLogResponse fromEntity(OneCExchangeLog entity) {
        return new OneCExchangeLogResponse(
                entity.getId(),
                entity.getConfigId(),
                entity.getExchangeType(),
                entity.getExchangeType().getDisplayName(),
                entity.getDirection(),
                entity.getDirection().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getRecordsProcessed(),
                entity.getRecordsFailed(),
                entity.getErrorMessage(),
                entity.getDetails(),
                entity.getCreatedAt()
        );
    }
}
