package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.EdoDocumentType;
import com.privod.platform.modules.integration.domain.EdoProvider;
import com.privod.platform.modules.integration.domain.ExternalDocument;
import com.privod.platform.modules.integration.domain.ExternalDocumentStatus;
import com.privod.platform.modules.integration.domain.SignatureStatus;

import java.time.Instant;
import java.util.UUID;

public record ExternalDocumentResponse(
        UUID id,
        String externalId,
        EdoProvider provider,
        String providerDisplayName,
        EdoDocumentType documentType,
        String documentTypeDisplayName,
        String title,
        String senderInn,
        String senderName,
        String recipientInn,
        String recipientName,
        ExternalDocumentStatus status,
        String statusDisplayName,
        SignatureStatus signatureStatus,
        String signatureStatusDisplayName,
        String fileUrl,
        String signedFileUrl,
        String linkedEntityType,
        UUID linkedEntityId,
        Instant receivedAt,
        Instant signedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ExternalDocumentResponse fromEntity(ExternalDocument entity) {
        return new ExternalDocumentResponse(
                entity.getId(),
                entity.getExternalId(),
                entity.getProvider(),
                entity.getProvider().getDisplayName(),
                entity.getDocumentType(),
                entity.getDocumentType().getDisplayName(),
                entity.getTitle(),
                entity.getSenderInn(),
                entity.getSenderName(),
                entity.getRecipientInn(),
                entity.getRecipientName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSignatureStatus(),
                entity.getSignatureStatus().getDisplayName(),
                entity.getFileUrl(),
                entity.getSignedFileUrl(),
                entity.getLinkedEntityType(),
                entity.getLinkedEntityId(),
                entity.getReceivedAt(),
                entity.getSignedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
