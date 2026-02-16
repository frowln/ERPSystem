package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoSignature;

import java.time.Instant;
import java.util.UUID;

public record EdoSignatureResponse(
        UUID id,
        UUID edoDocumentId,
        UUID signerId,
        String signerName,
        String signerPosition,
        String certificateSerialNumber,
        Instant signedAt,
        boolean isValid,
        String validationResult,
        Instant createdAt
) {
    public static EdoSignatureResponse fromEntity(EdoSignature entity) {
        return new EdoSignatureResponse(
                entity.getId(),
                entity.getEdoDocumentId(),
                entity.getSignerId(),
                entity.getSignerName(),
                entity.getSignerPosition(),
                entity.getCertificateSerialNumber(),
                entity.getSignedAt(),
                entity.isValid(),
                entity.getValidationResult(),
                entity.getCreatedAt()
        );
    }
}
