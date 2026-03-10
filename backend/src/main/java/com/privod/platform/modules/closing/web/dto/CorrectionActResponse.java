package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CorrectionActResponse(
        UUID id,
        String number,
        LocalDate documentDate,
        UUID originalKs2Id,
        String originalKs2Number,
        UUID projectId,
        UUID contractId,
        String status,
        BigDecimal correctionAmount,
        String reason,
        Instant createdAt,
        String createdBy
) {
}
