package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.ProjectSkillRequirement;
import com.privod.platform.modules.planning.domain.SkillCategory;

import java.time.Instant;
import java.util.UUID;

public record ProjectSkillRequirementResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String skillName,
        SkillCategory skillCategory,
        String skillCategoryDisplayName,
        Integer minimumProficiency,
        Integer requiredCount,
        Boolean isMandatory,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectSkillRequirementResponse fromEntity(ProjectSkillRequirement req) {
        return new ProjectSkillRequirementResponse(
                req.getId(),
                req.getOrganizationId(),
                req.getProjectId(),
                req.getSkillName(),
                req.getSkillCategory(),
                req.getSkillCategory() != null ? req.getSkillCategory().getDisplayName() : null,
                req.getMinimumProficiency(),
                req.getRequiredCount(),
                req.getIsMandatory(),
                req.getNotes(),
                req.getCreatedAt(),
                req.getUpdatedAt()
        );
    }
}
