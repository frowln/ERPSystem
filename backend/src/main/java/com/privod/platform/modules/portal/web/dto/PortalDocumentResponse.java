package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalDocument;

import java.time.Instant;
import java.util.UUID;

public record PortalDocumentResponse(
        UUID id,
        UUID portalUserId,
        UUID projectId,
        UUID documentId,
        UUID sharedById,
        Instant sharedAt,
        Instant expiresAt,
        Integer downloadCount,
        boolean expired,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalDocumentResponse fromEntity(PortalDocument doc) {
        return new PortalDocumentResponse(
                doc.getId(),
                doc.getPortalUserId(),
                doc.getProjectId(),
                doc.getDocumentId(),
                doc.getSharedById(),
                doc.getSharedAt(),
                doc.getExpiresAt(),
                doc.getDownloadCount(),
                doc.isExpired(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
