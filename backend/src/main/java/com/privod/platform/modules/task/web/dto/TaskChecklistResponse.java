package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskChecklist;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskChecklistResponse(
        UUID id,
        UUID taskId,
        String title,
        Integer sortOrder,
        boolean isCompleted,
        LocalDateTime completedAt,
        UUID completedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskChecklistResponse fromEntity(TaskChecklist checklist) {
        return new TaskChecklistResponse(
                checklist.getId(),
                checklist.getTaskId(),
                checklist.getTitle(),
                checklist.getSortOrder(),
                checklist.isCompleted(),
                checklist.getCompletedAt(),
                checklist.getCompletedById(),
                checklist.getCreatedAt(),
                checklist.getUpdatedAt()
        );
    }
}
