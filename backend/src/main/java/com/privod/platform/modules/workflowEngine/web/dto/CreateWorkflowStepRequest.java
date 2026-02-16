package com.privod.platform.modules.workflowEngine.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateWorkflowStepRequest(
        @NotNull(message = "ID определения рабочего процесса обязателен")
        UUID workflowDefinitionId,

        @NotBlank(message = "Наименование шага обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String fromStatus,
        String toStatus,
        String requiredRole,
        String approverIds,
        Integer slaHours,
        Integer sortOrder,
        String conditions
) {
}
