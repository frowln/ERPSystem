package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.SkillCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateProjectSkillRequirementRequest(
        @NotNull UUID projectId,
        @NotBlank String skillName,
        SkillCategory skillCategory,
        @Min(1) @Max(5) int minimumProficiency,
        @Min(1) int requiredCount,
        boolean isMandatory
) {
}
