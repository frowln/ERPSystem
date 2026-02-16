package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ChangeEventResponse(
        UUID id,
        UUID projectId,
        String number,
        String title,
        String description,
        ChangeEventSource source,
        String sourceDisplayName,
        ChangeEventStatus status,
        String statusDisplayName,
        UUID identifiedById,
        LocalDate identifiedDate,
        BigDecimal estimatedCostImpact,
        Integer estimatedScheduleImpact,
        BigDecimal actualCostImpact,
        Integer actualScheduleImpact,
        UUID linkedRfiId,
        UUID linkedIssueId,
        UUID contractId,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ChangeEventResponse fromEntity(ChangeEvent entity) {
        return new ChangeEventResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getSource(),
                entity.getSource() != null ? entity.getSource().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getIdentifiedById(),
                entity.getIdentifiedDate(),
                entity.getEstimatedCostImpact(),
                entity.getEstimatedScheduleImpact(),
                entity.getActualCostImpact(),
                entity.getActualScheduleImpact(),
                entity.getLinkedRfiId(),
                entity.getLinkedIssueId(),
                entity.getContractId(),
                entity.getTags(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
