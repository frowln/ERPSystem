package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.ReclamationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateReclamationRequest(
        UUID contractId,
        UUID counterpartyId,
        UUID projectId,
        String claimNumber,
        LocalDate claimDate,
        LocalDate deadline,
        String subject,
        String description,
        BigDecimal amount,
        ReclamationStatus status,
        String resolution
) {
}
