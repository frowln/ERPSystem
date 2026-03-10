package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.DependencyType;
import com.privod.platform.modules.task.domain.TaskDependency;

import java.util.UUID;

public record TaskDependencyResponse(
        UUID id,
        UUID taskId,
        UUID dependsOnTaskId,
        DependencyType dependencyType,
        int lagDays,
        String dependsOnTaskCode,
        String dependsOnTaskTitle
) {
    public static TaskDependencyResponse fromEntity(TaskDependency dependency) {
        return new TaskDependencyResponse(
                dependency.getId(),
                dependency.getTaskId(),
                dependency.getDependsOnTaskId(),
                dependency.getDependencyType(),
                dependency.getLagDays(),
                null,
                null
        );
    }

    public static TaskDependencyResponse fromEntity(TaskDependency dependency, String dependsOnTaskCode, String dependsOnTaskTitle) {
        return new TaskDependencyResponse(
                dependency.getId(),
                dependency.getTaskId(),
                dependency.getDependsOnTaskId(),
                dependency.getDependencyType(),
                dependency.getLagDays(),
                dependsOnTaskCode,
                dependsOnTaskTitle
        );
    }
}
