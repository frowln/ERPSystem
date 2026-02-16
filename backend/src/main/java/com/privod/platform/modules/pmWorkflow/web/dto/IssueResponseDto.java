package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.Issue;
import com.privod.platform.modules.pmWorkflow.domain.IssuePriority;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.domain.IssueType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record IssueResponseDto(
        UUID id,
        UUID projectId,
        String number,
        String title,
        String description,
        IssueType issueType,
        String issueTypeDisplayName,
        IssueStatus status,
        String statusDisplayName,
        IssuePriority priority,
        String priorityDisplayName,
        UUID assignedToId,
        UUID reportedById,
        LocalDate dueDate,
        LocalDate resolvedDate,
        UUID resolvedById,
        String location,
        UUID linkedRfiId,
        UUID linkedSubmittalId,
        String linkedDocumentIds,
        String rootCause,
        String resolution,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IssueResponseDto fromEntity(Issue entity) {
        return new IssueResponseDto(
                entity.getId(),
                entity.getProjectId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getIssueType(),
                entity.getIssueType() != null ? entity.getIssueType().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getPriority(),
                entity.getPriority().getDisplayName(),
                entity.getAssignedToId(),
                entity.getReportedById(),
                entity.getDueDate(),
                entity.getResolvedDate(),
                entity.getResolvedById(),
                entity.getLocation(),
                entity.getLinkedRfiId(),
                entity.getLinkedSubmittalId(),
                entity.getLinkedDocumentIds(),
                entity.getRootCause(),
                entity.getResolution(),
                entity.getTags(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
