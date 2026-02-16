package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignTaskRequest(
        @NotNull(message = "Идентификатор исполнителя обязателен")
        UUID assigneeId,

        String assigneeName
) {
}
