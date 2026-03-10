package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.DependencyType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTaskDependencyRequest(
        @NotNull(message = "Идентификатор задачи-предшественника обязателен")
        UUID predecessorTaskId,

        @NotNull(message = "Идентификатор задачи-преемника обязателен")
        UUID successorTaskId,

        DependencyType dependencyType,

        @Min(value = 0, message = "Задержка не может быть отрицательной")
        Integer lagDays
) {
}
