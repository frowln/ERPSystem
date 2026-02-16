package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.MappingDirection;
import com.privod.platform.modules.integration.domain.SyncMapping;

import java.time.Instant;
import java.util.UUID;

public record SyncMappingResponse(
        UUID id,
        UUID endpointId,
        String localEntityType,
        String localFieldName,
        String remoteEntityType,
        String remoteFieldName,
        String transformExpression,
        MappingDirection direction,
        String directionDisplayName,
        boolean isRequired,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SyncMappingResponse fromEntity(SyncMapping entity) {
        return new SyncMappingResponse(
                entity.getId(),
                entity.getEndpointId(),
                entity.getLocalEntityType(),
                entity.getLocalFieldName(),
                entity.getRemoteEntityType(),
                entity.getRemoteFieldName(),
                entity.getTransformExpression(),
                entity.getDirection(),
                entity.getDirection().getDisplayName(),
                entity.isRequired(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
