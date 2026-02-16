package com.privod.platform.modules.immutableAudit.web.dto;

import com.privod.platform.modules.immutableAudit.domain.ImmutableRecord;

import java.time.Instant;
import java.util.UUID;

public record ImmutableRecordResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String recordHash,
        String contentSnapshot,
        UUID previousRecordId,
        Instant recordedAt,
        UUID recordedById,
        String action,
        Integer recordVersion,
        Boolean isSuperseded,
        UUID supersededById,
        Instant supersededAt,
        Boolean chainValid,
        Instant createdAt,
        String createdBy
) {
    public static ImmutableRecordResponse fromEntity(ImmutableRecord entity) {
        return new ImmutableRecordResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getRecordHash(),
                entity.getContentSnapshot(),
                entity.getPreviousRecordId(),
                entity.getRecordedAt(),
                entity.getRecordedById(),
                entity.getAction(),
                entity.getRecordVersion(),
                entity.getIsSuperseded(),
                entity.getSupersededById(),
                entity.getSupersededAt(),
                entity.getChainValid(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
