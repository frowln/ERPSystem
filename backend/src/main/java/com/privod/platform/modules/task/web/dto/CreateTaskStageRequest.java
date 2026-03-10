package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTaskStageRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,
        @NotBlank(message = "Название стадии обязательно")
        String name,
        String color,
        String icon,
        String description,
        Boolean isDefault,
        Boolean isClosed,
        Integer sequence
) {}
