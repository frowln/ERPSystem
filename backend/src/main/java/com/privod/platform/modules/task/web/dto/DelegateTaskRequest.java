package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record DelegateTaskRequest(
    @NotNull(message = "ID нового ответственного обязателен")
    UUID delegateToId,
    String delegateToName,
    String comment
) {}
