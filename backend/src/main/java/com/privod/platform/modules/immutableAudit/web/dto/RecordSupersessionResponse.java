package com.privod.platform.modules.immutableAudit.web.dto;

import com.privod.platform.modules.immutableAudit.domain.RecordSupersession;

import java.time.Instant;
import java.util.UUID;

public record RecordSupersessionResponse(
        UUID id,
        UUID originalRecordId,
        UUID supersedingRecordId,
        String reason,
        Instant supersededAt,
        UUID supersededById,
        Instant createdAt,
        String createdBy
) {
    public static RecordSupersessionResponse fromEntity(RecordSupersession entity) {
        return new RecordSupersessionResponse(
                entity.getId(),
                entity.getOriginalRecordId(),
                entity.getSupersedingRecordId(),
                entity.getReason(),
                entity.getSupersededAt(),
                entity.getSupersededById(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
