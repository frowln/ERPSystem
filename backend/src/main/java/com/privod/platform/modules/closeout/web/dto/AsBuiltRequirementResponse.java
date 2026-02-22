package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.AsBuiltRequirement;

import java.time.Instant;
import java.util.UUID;

public record AsBuiltRequirementResponse(
        UUID id,
        UUID projectId,
        String workType,
        String workTypeDisplayName,
        String docCategory,
        String description,
        boolean isRequired,
        Instant createdAt
) {
    public static AsBuiltRequirementResponse fromEntity(AsBuiltRequirement e) {
        return new AsBuiltRequirementResponse(
                e.getId(),
                e.getProjectId(),
                e.getWorkType().name(),
                e.getWorkType().getDisplayName(),
                e.getDocCategory(),
                e.getDescription(),
                e.isRequired(),
                e.getCreatedAt()
        );
    }
}
