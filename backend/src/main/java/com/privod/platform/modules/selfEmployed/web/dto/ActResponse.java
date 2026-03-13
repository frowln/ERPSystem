package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.ActStatus;
import com.privod.platform.modules.selfEmployed.domain.CompletionAct;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ActResponse(
        UUID id,
        UUID organizationId,
        UUID workerId,
        String workerFullName,
        UUID projectId,
        String actNumber,
        String description,
        BigDecimal amount,
        String period,
        ActStatus status,
        String statusDisplayName,
        Instant signedAt,
        Instant paidAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static ActResponse fromEntity(CompletionAct a) {
        return new ActResponse(
                a.getId(),
                a.getOrganizationId(),
                a.getWorker() != null ? a.getWorker().getId() : null,
                a.getWorker() != null ? a.getWorker().getFullName() : null,
                a.getProjectId(),
                a.getActNumber(),
                a.getDescription(),
                a.getAmount(),
                a.getPeriod(),
                a.getStatus(),
                a.getStatus().getDisplayName(),
                a.getSignedAt(),
                a.getPaidAt(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
