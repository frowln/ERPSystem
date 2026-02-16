package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.ActionType;
import com.privod.platform.modules.workflowEngine.domain.WorkflowTriggerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAutomationRuleRequest(
        @NotBlank(message = "Наименование правила обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType,

        @NotNull(message = "Тип триггера обязателен")
        WorkflowTriggerType triggerType,

        String triggerCondition,

        @NotNull(message = "Тип действия обязателен")
        ActionType actionType,

        String actionConfig,

        Boolean isActive,
        UUID organizationId,
        Integer priority
) {
}
