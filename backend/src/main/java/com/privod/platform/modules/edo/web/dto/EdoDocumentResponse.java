package com.privod.platform.modules.edo.web.dto;

import com.privod.platform.modules.edo.domain.EdoDocument;
import com.privod.platform.modules.edo.domain.EdoDocumentStatus;

import java.time.Instant;
import java.util.UUID;

public record EdoDocumentResponse(
        UUID id,
        UUID organizationId,
        UUID configId,
        String sourceType,
        UUID sourceId,
        String externalId,
        EdoDocumentStatus status,
        String statusDisplayName,
        String counterpartyInn,
        String counterpartyName,
        Instant sentAt,
        Instant signedAt,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public static EdoDocumentResponse fromEntity(EdoDocument doc) {
        return new EdoDocumentResponse(
                doc.getId(),
                doc.getOrganizationId(),
                doc.getConfigId(),
                doc.getSourceType(),
                doc.getSourceId(),
                doc.getExternalId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getCounterpartyInn(),
                doc.getCounterpartyName(),
                doc.getSentAt(),
                doc.getSignedAt(),
                doc.getErrorMessage(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
