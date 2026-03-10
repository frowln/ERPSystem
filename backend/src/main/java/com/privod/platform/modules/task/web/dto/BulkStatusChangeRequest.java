package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record BulkStatusChangeRequest(
    @NotEmpty(message = "Список задач не может быть пустым")
    List<UUID> taskIds,
    @NotNull(message = "Статус обязателен")
    TaskStatus status
) {}
