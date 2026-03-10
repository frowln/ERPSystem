package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record BulkAssignRequest(
    @NotEmpty(message = "Список задач не может быть пустым")
    List<UUID> taskIds,
    @NotNull(message = "ID исполнителя обязателен")
    UUID assigneeId,
    String assigneeName
) {}
