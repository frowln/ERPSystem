package com.privod.platform.modules.kep.web.dto;

import com.privod.platform.modules.kep.domain.KepSignature;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record KepSignatureResponse(
        UUID id,
        UUID certificateId,
        String documentModel,
        UUID documentId,
        LocalDateTime signedAt,
        String signatureHash,
        boolean valid,
        String validationMessage,
        String signerName,
        String signerPosition,
        Instant createdAt
) {
    public static KepSignatureResponse fromEntity(KepSignature sig) {
        return new KepSignatureResponse(
                sig.getId(),
                sig.getCertificateId(),
                sig.getDocumentModel(),
                sig.getDocumentId(),
                sig.getSignedAt(),
                sig.getSignatureHash(),
                sig.isValid(),
                sig.getValidationMessage(),
                sig.getSignerName(),
                sig.getSignerPosition(),
                sig.getCreatedAt()
        );
    }
}
