package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.pto.domain.WorkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAsBuiltRequirementRequest(
        UUID projectId,
        @NotNull WorkType workType,
        @NotBlank @Size(max = 100) String docCategory,
        String description,
        boolean isRequired
) {
}
