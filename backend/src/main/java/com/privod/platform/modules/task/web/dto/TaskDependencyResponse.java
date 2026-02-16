package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.DependencyType;
import com.privod.platform.modules.task.domain.TaskDependency;

import java.util.UUID;

public record TaskDependencyResponse(
        UUID id,
        UUID taskId,
        UUID dependsOnTaskId,
        DependencyType dependencyType
) {
    public static TaskDependencyResponse fromEntity(TaskDependency dependency) {
        return new TaskDependencyResponse(
                dependency.getId(),
                dependency.getTaskId(),
                dependency.getDependsOnTaskId(),
                dependency.getDependencyType()
        );
    }
}
