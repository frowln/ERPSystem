package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.ProjectSection;
import java.time.Instant;
import java.util.UUID;

public record ProjectSectionResponse(
        UUID id,
        UUID projectId,
        String code,
        String name,
        boolean enabled,
        boolean custom,
        Integer sequence,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectSectionResponse fromEntity(ProjectSection s) {
        return new ProjectSectionResponse(
                s.getId(), s.getProjectId(), s.getCode(), s.getName(),
                s.isEnabled(), s.isCustom(), s.getSequence(),
                s.getCreatedAt(), s.getUpdatedAt()
        );
    }
}
