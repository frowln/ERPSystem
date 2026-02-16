package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentAuditEntry;

import java.time.Instant;
import java.util.UUID;

public record DocumentAuditEntryResponse(
        UUID id,
        UUID documentContainerId,
        String action,
        UUID performedById,
        Instant performedAt,
        String previousState,
        String newState,
        String details,
        String ipAddress,
        Instant createdAt
) {
    public static DocumentAuditEntryResponse fromEntity(DocumentAuditEntry entity) {
        return new DocumentAuditEntryResponse(
                entity.getId(),
                entity.getDocumentContainerId(),
                entity.getAction(),
                entity.getPerformedById(),
                entity.getPerformedAt(),
                entity.getPreviousState(),
                entity.getNewState(),
                entity.getDetails(),
                entity.getIpAddress(),
                entity.getCreatedAt()
        );
    }
}
