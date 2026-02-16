package com.privod.platform.modules.workflowEngine.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateWorkflowTransitionRequest(
        @NotNull(message = "ID шага рабочего процесса обязателен")
        UUID workflowStepId,

        @NotNull(message = "ID сущности обязателен")
        UUID entityId,

        @NotBlank(message = "Тип сущности обязателен")
        String entityType,

        UUID transitionedById,
        String fromStatus,
        String toStatus,
        String comments
) {
}
