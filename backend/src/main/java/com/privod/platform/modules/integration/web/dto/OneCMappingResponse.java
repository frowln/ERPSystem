package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;

import java.time.Instant;
import java.util.UUID;

public record OneCMappingResponse(
        UUID id,
        String entityType,
        UUID privodId,
        String oneCId,
        String oneCCode,
        Instant lastSyncAt,
        OneCMappingSyncStatus syncStatus,
        String syncStatusDisplayName,
        String conflictData,
        Instant createdAt,
        Instant updatedAt
) {
    public static OneCMappingResponse fromEntity(OneCMapping entity) {
        return new OneCMappingResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getPrivodId(),
                entity.getOneCId(),
                entity.getOneCCode(),
                entity.getLastSyncAt(),
                entity.getSyncStatus(),
                entity.getSyncStatus().getDisplayName(),
                entity.getConflictData(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
