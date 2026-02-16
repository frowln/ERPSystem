package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.WorkflowDefinition;

import java.time.Instant;
import java.util.UUID;

public record WorkflowDefinitionResponse(
        UUID id,
        String name,
        String description,
        String entityType,
        Boolean isActive,
        UUID organizationId,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkflowDefinitionResponse fromEntity(WorkflowDefinition def) {
        return new WorkflowDefinitionResponse(
                def.getId(),
                def.getName(),
                def.getDescription(),
                def.getEntityType(),
                def.getIsActive(),
                def.getOrganizationId(),
                def.getCreatedById(),
                def.getCreatedAt(),
                def.getUpdatedAt()
        );
    }
}
