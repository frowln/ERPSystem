package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.EmployeeSkill;
import com.privod.platform.modules.planning.domain.SkillCategory;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeSkillResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        String skillName,
        SkillCategory skillCategory,
        String skillCategoryDisplayName,
        Integer proficiencyLevel,
        LocalDate certifiedUntil,
        String certificationNumber,
        Instant verifiedAt,
        UUID verifiedBy,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static EmployeeSkillResponse fromEntity(EmployeeSkill skill) {
        return new EmployeeSkillResponse(
                skill.getId(),
                skill.getOrganizationId(),
                skill.getEmployeeId(),
                skill.getSkillName(),
                skill.getSkillCategory(),
                skill.getSkillCategory() != null ? skill.getSkillCategory().getDisplayName() : null,
                skill.getProficiencyLevel(),
                skill.getCertifiedUntil(),
                skill.getCertificationNumber(),
                skill.getVerifiedAt(),
                skill.getVerifiedBy(),
                skill.getNotes(),
                skill.getCreatedAt(),
                skill.getUpdatedAt()
        );
    }
}
