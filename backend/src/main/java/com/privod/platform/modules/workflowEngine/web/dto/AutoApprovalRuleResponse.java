package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import com.privod.platform.modules.workflowEngine.domain.AutoApprovalRule;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AutoApprovalRuleResponse(
        UUID id,
        String name,
        String description,
        ApprovalEntityType entityType,
        String entityTypeDisplayName,
        String conditions,
        BigDecimal autoApproveThreshold,
        Integer requiredApprovers,
        Integer escalationTimeoutHours,
        Boolean isActive,
        UUID projectId,
        UUID organizationId,
        Instant createdAt,
        Instant updatedAt
) {
    public static AutoApprovalRuleResponse fromEntity(AutoApprovalRule rule) {
        return new AutoApprovalRuleResponse(
                rule.getId(),
                rule.getName(),
                rule.getDescription(),
                rule.getEntityType(),
                rule.getEntityType().getDisplayName(),
                rule.getConditions(),
                rule.getAutoApproveThreshold(),
                rule.getRequiredApprovers(),
                rule.getEscalationTimeoutHours(),
                rule.getIsActive(),
                rule.getProjectId(),
                rule.getOrganizationId(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
