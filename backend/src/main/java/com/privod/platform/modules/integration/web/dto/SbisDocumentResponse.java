package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SbisDirection;
import com.privod.platform.modules.integration.domain.SbisDocument;
import com.privod.platform.modules.integration.domain.SbisDocumentStatus;
import com.privod.platform.modules.integration.domain.SbisDocumentType;

import java.time.Instant;
import java.util.UUID;

public record SbisDocumentResponse(
        UUID id,
        String sbisId,
        SbisDocumentType documentType,
        String documentTypeDisplayName,
        UUID internalDocumentId,
        String internalDocumentModel,
        String partnerInn,
        String partnerKpp,
        String partnerName,
        SbisDirection direction,
        String directionDisplayName,
        SbisDocumentStatus status,
        String statusDisplayName,
        Instant sentAt,
        Instant receivedAt,
        Instant signedAt,
        String errorMessage,
        String documentData,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SbisDocumentResponse fromEntity(SbisDocument entity) {
        return new SbisDocumentResponse(
                entity.getId(),
                entity.getSbisId(),
                entity.getDocumentType(),
                entity.getDocumentType().getDisplayName(),
                entity.getInternalDocumentId(),
                entity.getInternalDocumentModel(),
                entity.getPartnerInn(),
                entity.getPartnerKpp(),
                entity.getPartnerName(),
                entity.getDirection(),
                entity.getDirection().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSentAt(),
                entity.getReceivedAt(),
                entity.getSignedAt(),
                entity.getErrorMessage(),
                entity.getDocumentData(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
