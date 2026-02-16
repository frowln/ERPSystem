package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.ActionType;
import com.privod.platform.modules.workflowEngine.domain.AutomationRule;
import com.privod.platform.modules.workflowEngine.domain.WorkflowTriggerType;

import java.time.Instant;
import java.util.UUID;

public record AutomationRuleResponse(
        UUID id,
        String name,
        String description,
        String entityType,
        WorkflowTriggerType triggerType,
        String triggerTypeDisplayName,
        String triggerCondition,
        ActionType actionType,
        String actionTypeDisplayName,
        String actionConfig,
        Boolean isActive,
        UUID organizationId,
        Integer priority,
        Instant lastExecutedAt,
        Integer executionCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static AutomationRuleResponse fromEntity(AutomationRule rule) {
        return new AutomationRuleResponse(
                rule.getId(),
                rule.getName(),
                rule.getDescription(),
                rule.getEntityType(),
                rule.getTriggerType(),
                rule.getTriggerType().getDisplayName(),
                rule.getTriggerCondition(),
                rule.getActionType(),
                rule.getActionType().getDisplayName(),
                rule.getActionConfig(),
                rule.getIsActive(),
                rule.getOrganizationId(),
                rule.getPriority(),
                rule.getLastExecutedAt(),
                rule.getExecutionCount(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
