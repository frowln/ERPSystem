package com.privod.platform.modules.immutableAudit.web.dto;

import java.util.UUID;

public record ChainVerificationResponse(
        String entityType,
        UUID entityId,
        int totalRecords,
        boolean chainValid,
        String message
) {
}
