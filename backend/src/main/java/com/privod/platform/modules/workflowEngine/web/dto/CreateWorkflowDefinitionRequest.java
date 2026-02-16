package com.privod.platform.modules.workflowEngine.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateWorkflowDefinitionRequest(
        @NotBlank(message = "Наименование рабочего процесса обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType,

        Boolean isActive,
        UUID organizationId,
        UUID createdById
) {
}
