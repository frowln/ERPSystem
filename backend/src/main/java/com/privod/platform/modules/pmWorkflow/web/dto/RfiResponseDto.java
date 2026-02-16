package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.Rfi;
import com.privod.platform.modules.pmWorkflow.domain.RfiPriority;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RfiResponseDto(
        UUID id,
        UUID projectId,
        String number,
        String subject,
        String question,
        String answer,
        RfiStatus status,
        String statusDisplayName,
        RfiPriority priority,
        String priorityDisplayName,
        UUID assignedToId,
        UUID responsibleId,
        LocalDate dueDate,
        LocalDate answeredDate,
        UUID answeredById,
        Boolean costImpact,
        Boolean scheduleImpact,
        UUID relatedDrawingId,
        String relatedSpecSection,
        String distributionList,
        String linkedDocumentIds,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RfiResponseDto fromEntity(Rfi entity) {
        return new RfiResponseDto(
                entity.getId(),
                entity.getProjectId(),
                entity.getNumber(),
                entity.getSubject(),
                entity.getQuestion(),
                entity.getAnswer(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getPriority(),
                entity.getPriority().getDisplayName(),
                entity.getAssignedToId(),
                entity.getResponsibleId(),
                entity.getDueDate(),
                entity.getAnsweredDate(),
                entity.getAnsweredById(),
                entity.getCostImpact(),
                entity.getScheduleImpact(),
                entity.getRelatedDrawingId(),
                entity.getRelatedSpecSection(),
                entity.getDistributionList(),
                entity.getLinkedDocumentIds(),
                entity.getTags(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
