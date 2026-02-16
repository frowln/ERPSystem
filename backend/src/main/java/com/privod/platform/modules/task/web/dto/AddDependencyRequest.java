package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.DependencyType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddDependencyRequest(
        @NotNull(message = "Идентификатор задачи-предшественника обязателен")
        UUID dependsOnTaskId,

        DependencyType dependencyType
) {
}
