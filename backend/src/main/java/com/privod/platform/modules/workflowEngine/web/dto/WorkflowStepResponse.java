package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.WorkflowStep;

import java.time.Instant;
import java.util.UUID;

public record WorkflowStepResponse(
        UUID id,
        UUID workflowDefinitionId,
        String name,
        String description,
        String actionType,
        String actionConfig,
        String fromStatus,
        String toStatus,
        String requiredRole,
        String approverIds,
        Integer slaHours,
        Integer sortOrder,
        String conditions,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkflowStepResponse fromEntity(WorkflowStep step) {
        return new WorkflowStepResponse(
                step.getId(),
                step.getWorkflowDefinitionId(),
                step.getName(),
                step.getDescription(),
                step.getActionType(),
                step.getActionConfig(),
                step.getFromStatus(),
                step.getToStatus(),
                step.getRequiredRole(),
                step.getApproverIds(),
                step.getSlaHours(),
                step.getSortOrder(),
                step.getConditions(),
                step.getCreatedAt(),
                step.getUpdatedAt()
        );
    }
}
