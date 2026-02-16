package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.WorkflowTransition;

import java.time.Instant;
import java.util.UUID;

public record WorkflowTransitionResponse(
        UUID id,
        UUID workflowStepId,
        UUID entityId,
        String entityType,
        UUID transitionedById,
        Instant transitionedAt,
        String fromStatus,
        String toStatus,
        String comments,
        Long duration,
        Instant createdAt
) {
    public static WorkflowTransitionResponse fromEntity(WorkflowTransition transition) {
        return new WorkflowTransitionResponse(
                transition.getId(),
                transition.getWorkflowStepId(),
                transition.getEntityId(),
                transition.getEntityType(),
                transition.getTransitionedById(),
                transition.getTransitionedAt(),
                transition.getFromStatus(),
                transition.getToStatus(),
                transition.getComments(),
                transition.getDuration(),
                transition.getCreatedAt()
        );
    }
}
