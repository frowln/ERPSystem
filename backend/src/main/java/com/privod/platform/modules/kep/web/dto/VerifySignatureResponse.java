package com.privod.platform.modules.kep.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record VerifySignatureResponse(
        UUID signatureId,
        boolean valid,
        String signerName,
        String certificateSubject,
        LocalDateTime signedAt,
        String validationMessage
) {
}
