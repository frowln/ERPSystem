package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record BulkDeleteRequest(
    @NotEmpty(message = "Список задач не может быть пустым")
    List<UUID> taskIds
) {}
