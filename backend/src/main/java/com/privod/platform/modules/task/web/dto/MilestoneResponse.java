package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.Milestone;
import com.privod.platform.modules.task.domain.MilestoneStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MilestoneResponse(
        UUID id,
        String name,
        UUID projectId,
        LocalDate dueDate,
        LocalDate completedDate,
        MilestoneStatus status,
        String statusDisplayName,
        String description,
        Integer progress,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MilestoneResponse fromEntity(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getName(),
                milestone.getProjectId(),
                milestone.getDueDate(),
                milestone.getCompletedDate(),
                milestone.getStatus(),
                milestone.getStatus().getDisplayName(),
                milestone.getDescription(),
                milestone.getProgress(),
                milestone.getCreatedAt(),
                milestone.getUpdatedAt(),
                milestone.getCreatedBy()
        );
    }
}
