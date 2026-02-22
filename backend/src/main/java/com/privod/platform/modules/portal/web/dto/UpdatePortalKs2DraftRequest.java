package com.privod.platform.modules.portal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdatePortalKs2DraftRequest(
        UUID projectId,
        UUID contractId,
        String draftNumber,
        LocalDate reportingPeriodStart,
        LocalDate reportingPeriodEnd,
        BigDecimal totalAmount,
        String workDescription,
        String linesJson
) {
}
