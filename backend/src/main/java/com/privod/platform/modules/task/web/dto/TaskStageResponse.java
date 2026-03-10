package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskStage;

import java.time.Instant;
import java.util.UUID;

public record TaskStageResponse(
        UUID id,
        UUID projectId,
        String name,
        Integer sequence,
        String color,
        String icon,
        String description,
        boolean isDefault,
        boolean isClosed,
        Instant createdAt
) {
    public static TaskStageResponse fromEntity(TaskStage stage) {
        return new TaskStageResponse(
                stage.getId(),
                stage.getProjectId(),
                stage.getName(),
                stage.getSequence(),
                stage.getColor(),
                stage.getIcon(),
                stage.getDescription(),
                stage.isDefault(),
                stage.isClosed(),
                stage.getCreatedAt()
        );
    }
}
