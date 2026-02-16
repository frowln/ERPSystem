package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.EntityChangeLog;

import java.time.Instant;
import java.util.UUID;

public record EntityChangeLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String fieldName,
        String oldValue,
        String newValue,
        UUID changedById,
        Instant changedAt
) {
    public static EntityChangeLogResponse fromEntity(EntityChangeLog entity) {
        return new EntityChangeLogResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getFieldName(),
                entity.getOldValue(),
                entity.getNewValue(),
                entity.getChangedById(),
                entity.getChangedAt()
        );
    }
}
