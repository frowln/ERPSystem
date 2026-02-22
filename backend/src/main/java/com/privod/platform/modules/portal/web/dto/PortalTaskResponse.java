package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalTask;
import com.privod.platform.modules.portal.domain.PortalTaskPriority;
import com.privod.platform.modules.portal.domain.PortalTaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PortalTaskResponse(
        UUID id,
        UUID organizationId,
        UUID portalUserId,
        UUID projectId,
        String title,
        String description,
        PortalTaskStatus status,
        String statusDisplayName,
        PortalTaskPriority priority,
        String priorityDisplayName,
        LocalDate dueDate,
        Instant completedAt,
        UUID assignedById,
        String completionNote,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalTaskResponse fromEntity(PortalTask task) {
        return new PortalTaskResponse(
                task.getId(),
                task.getOrganizationId(),
                task.getPortalUserId(),
                task.getProjectId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getStatus().getDisplayName(),
                task.getPriority(),
                task.getPriority().getDisplayName(),
                task.getDueDate(),
                task.getCompletedAt(),
                task.getAssignedById(),
                task.getCompletionNote(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
