package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.AccessLevel;
import com.privod.platform.modules.document.domain.DocumentAccess;

import java.time.Instant;
import java.util.UUID;

public record DocumentAccessResponse(
        UUID id,
        UUID documentId,
        UUID userId,
        AccessLevel accessLevel,
        String accessLevelDisplayName,
        UUID grantedById,
        String grantedByName,
        Instant createdAt
) {
    public static DocumentAccessResponse fromEntity(DocumentAccess access) {
        return new DocumentAccessResponse(
                access.getId(),
                access.getDocumentId(),
                access.getUserId(),
                access.getAccessLevel(),
                access.getAccessLevel().getDisplayName(),
                access.getGrantedById(),
                access.getGrantedByName(),
                access.getCreatedAt()
        );
    }
}
