package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.IdempotencyRecord;
import com.privod.platform.modules.apiManagement.domain.IdempotencyStatus;

import java.time.Instant;
import java.util.UUID;

public record IdempotencyRecordResponse(
        UUID id,
        String idempotencyKey,
        String requestHash,
        IdempotencyStatus status,
        String statusDisplayName,
        Instant recordCreatedAt,
        Instant expiresAt
) {
    public static IdempotencyRecordResponse fromEntity(IdempotencyRecord record) {
        return new IdempotencyRecordResponse(
                record.getId(),
                record.getIdempotencyKey(),
                record.getRequestHash(),
                record.getStatus(),
                record.getStatus().getDisplayName(),
                record.getRecordCreatedAt(),
                record.getExpiresAt()
        );
    }
}
