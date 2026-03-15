package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.Reclamation;
import com.privod.platform.modules.accounting.domain.ReclamationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReclamationResponse(
        UUID id,
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
        String statusDisplayName,
        String resolution,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ReclamationResponse fromEntity(Reclamation r) {
        return new ReclamationResponse(
                r.getId(),
                r.getContractId(),
                r.getCounterpartyId(),
                r.getProjectId(),
                r.getClaimNumber(),
                r.getClaimDate(),
                r.getDeadline(),
                r.getSubject(),
                r.getDescription(),
                r.getAmount(),
                r.getStatus(),
                r.getStatus() != null ? r.getStatus().getDisplayName() : null,
                r.getResolution(),
                r.getResolvedAt(),
                r.getCreatedAt(),
                r.getUpdatedAt(),
                r.getCreatedBy()
        );
    }
}
