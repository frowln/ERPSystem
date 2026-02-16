package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectHealthStatus;
import com.privod.platform.modules.project.domain.ProjectUpdate;

import java.time.Instant;
import java.util.UUID;

public record ProjectUpdateResponse(
        UUID id,
        UUID projectId,
        UUID authorId,
        String title,
        String description,
        ProjectHealthStatus status,
        String statusDisplayName,
        Integer progressPercentage,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ProjectUpdateResponse fromEntity(ProjectUpdate update) {
        return new ProjectUpdateResponse(
                update.getId(),
                update.getProjectId(),
                update.getAuthorId(),
                update.getTitle(),
                update.getDescription(),
                update.getStatus(),
                update.getStatus().getDisplayName(),
                update.getProgressPercentage(),
                update.getCreatedAt(),
                update.getUpdatedAt(),
                update.getCreatedBy()
        );
    }
}
