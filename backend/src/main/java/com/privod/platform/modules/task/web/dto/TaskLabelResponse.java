package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskLabel;
import java.time.Instant;
import java.util.UUID;

public record TaskLabelResponse(
    UUID id,
    String name,
    String color,
    String icon,
    UUID organizationId,
    Instant createdAt
) {
    public static TaskLabelResponse fromEntity(TaskLabel label) {
        return new TaskLabelResponse(
            label.getId(),
            label.getName(),
            label.getColor(),
            label.getIcon(),
            label.getOrganizationId(),
            label.getCreatedAt()
        );
    }
}
