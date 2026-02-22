package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.CommissioningChecklistTemplate;

import java.time.Instant;
import java.util.UUID;

public record CommissioningTemplateResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String name,
        String system,
        String description,
        String checkItemDefinitions,
        int sortOrder,
        boolean isActive,
        Instant createdAt
) {
    public static CommissioningTemplateResponse fromEntity(CommissioningChecklistTemplate entity) {
        return new CommissioningTemplateResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getSystem(),
                entity.getDescription(),
                entity.getCheckItemDefinitions(),
                entity.getSortOrder(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
