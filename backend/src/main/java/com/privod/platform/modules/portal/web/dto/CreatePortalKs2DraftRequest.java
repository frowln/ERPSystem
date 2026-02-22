package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePortalKs2DraftRequest(
        @NotNull(message = "ID проекта обязателен")
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
