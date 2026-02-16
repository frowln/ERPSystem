package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.kep.domain.KepSignature;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record KepSignatureResponse(
        UUID id,
        String documentModel,
        UUID documentId,
        UUID certificateId,
        String signerName,
        LocalDateTime signedAt,
        boolean valid,
        String validationMessage,
        Instant createdAt
) {
    public static KepSignatureResponse fromEntity(KepSignature entity) {
        return new KepSignatureResponse(
                entity.getId(),
                entity.getDocumentModel(),
                entity.getDocumentId(),
                entity.getCertificateId(),
                entity.getSignerName(),
                entity.getSignedAt(),
                entity.isValid(),
                entity.getValidationMessage(),
                entity.getCreatedAt()
        );
    }
}
