package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeTaskStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        TaskStatus status
) {
}
