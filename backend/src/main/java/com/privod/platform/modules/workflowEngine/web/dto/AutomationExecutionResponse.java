package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.AutomationExecution;
import com.privod.platform.modules.workflowEngine.domain.ExecutionStatus;

import java.time.Instant;
import java.util.UUID;

public record AutomationExecutionResponse(
        UUID id,
        UUID automationRuleId,
        UUID entityId,
        String entityType,
        ExecutionStatus executionStatus,
        String executionStatusDisplayName,
        Instant startedAt,
        Instant completedAt,
        String triggerData,
        String resultData,
        String errorMessage,
        Instant createdAt
) {
    public static AutomationExecutionResponse fromEntity(AutomationExecution exec) {
        return new AutomationExecutionResponse(
                exec.getId(),
                exec.getAutomationRuleId(),
                exec.getEntityId(),
                exec.getEntityType(),
                exec.getExecutionStatus(),
                exec.getExecutionStatus().getDisplayName(),
                exec.getStartedAt(),
                exec.getCompletedAt(),
                exec.getTriggerData(),
                exec.getResultData(),
                exec.getErrorMessage(),
                exec.getCreatedAt()
        );
    }
}
