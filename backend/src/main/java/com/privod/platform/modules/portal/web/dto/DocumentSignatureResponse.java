package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClientDocumentSignature;

import java.time.Instant;
import java.util.UUID;

public record DocumentSignatureResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID portalUserId,
        UUID documentId,
        String documentTitle,
        String documentUrl,
        String signatureStatus,
        String signatureStatusDisplayName,
        Instant signedAt,
        String rejectedReason,
        Instant expiresAt,
        boolean reminderSent,
        boolean expired,
        Instant createdAt,
        Instant updatedAt
) {
    public static DocumentSignatureResponse fromEntity(ClientDocumentSignature s) {
        return new DocumentSignatureResponse(
                s.getId(),
                s.getOrganizationId(),
                s.getProjectId(),
                s.getPortalUserId(),
                s.getDocumentId(),
                s.getDocumentTitle(),
                s.getDocumentUrl(),
                s.getSignatureStatus() != null ? s.getSignatureStatus().name() : null,
                s.getSignatureStatus() != null ? s.getSignatureStatus().getDisplayName() : null,
                s.getSignedAt(),
                s.getRejectedReason(),
                s.getExpiresAt(),
                s.isReminderSent(),
                s.isExpired(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
