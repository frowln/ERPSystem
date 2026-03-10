package com.privod.platform.modules.workflowEngine.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkflowStepRequest(
        @NotBlank(message = "Наименование шага обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,
        String fromStatus,
        String toStatus,
        String requiredRole,
        String approverIds,
        String actionType,
        String actionConfig,
        Integer slaHours,
        Integer sortOrder,
        String conditions
) {
}
