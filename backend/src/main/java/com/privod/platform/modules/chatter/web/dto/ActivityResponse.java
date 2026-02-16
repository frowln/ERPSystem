package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.Activity;
import com.privod.platform.modules.chatter.domain.ActivityStatus;
import com.privod.platform.modules.chatter.domain.ChatterActivityType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        String entityType,
        UUID entityId,
        ChatterActivityType activityType,
        String activityTypeDisplayName,
        String summary,
        String description,
        UUID assignedToId,
        LocalDate dueDate,
        ActivityStatus status,
        String statusDisplayName,
        boolean overdue,
        Instant completedAt,
        UUID completedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static ActivityResponse fromEntity(Activity entity) {
        return new ActivityResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getActivityType(),
                entity.getActivityType().getDisplayName(),
                entity.getSummary(),
                entity.getDescription(),
                entity.getAssignedToId(),
                entity.getDueDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.isOverdue(),
                entity.getCompletedAt(),
                entity.getCompletedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
