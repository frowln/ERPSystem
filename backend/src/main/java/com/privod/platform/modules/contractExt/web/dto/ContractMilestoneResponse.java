package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ContractMilestone;
import com.privod.platform.modules.contractExt.domain.MilestoneStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ContractMilestoneResponse(
        UUID id,
        UUID contractId,
        String name,
        String description,
        LocalDate dueDate,
        String completionCriteria,
        BigDecimal amount,
        MilestoneStatus status,
        String statusDisplayName,
        Instant completedAt,
        String evidenceUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractMilestoneResponse fromEntity(ContractMilestone entity) {
        return new ContractMilestoneResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getName(),
                entity.getDescription(),
                entity.getDueDate(),
                entity.getCompletionCriteria(),
                entity.getAmount(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCompletedAt(),
                entity.getEvidenceUrl(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
