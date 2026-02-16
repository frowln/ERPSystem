package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaskTemplateResponse(
        UUID id,
        String name,
        String description,
        TaskPriority defaultPriority,
        String defaultPriorityDisplayName,
        BigDecimal estimatedHours,
        String category,
        String checklistTemplate,
        String tags,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TaskTemplateResponse fromEntity(TaskTemplate template) {
        return new TaskTemplateResponse(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getDefaultPriority(),
                template.getDefaultPriority().getDisplayName(),
                template.getEstimatedHours(),
                template.getCategory(),
                template.getChecklistTemplate(),
                template.getTags(),
                template.isActive(),
                template.getCreatedAt(),
                template.getUpdatedAt(),
                template.getCreatedBy()
        );
    }
}
