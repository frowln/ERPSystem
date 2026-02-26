package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;

import java.time.Instant;
import java.util.UUID;

public record SpecificationListResponse(
        UUID id,
        String name,
        String title,
        String projectName,
        UUID projectId,
        Integer version,
        boolean isCurrent,
        SpecificationStatus status,
        String statusDisplayName,
        long itemCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static SpecificationListResponse fromEntity(Specification specification, long itemCount) {
        return new SpecificationListResponse(
                specification.getId(),
                specification.getName(),
                specification.getDisplayName(),
                specification.getProjectName(),
                specification.getProjectId(),
                specification.getDocVersion(),
                specification.isCurrent(),
                specification.getStatus(),
                specification.getStatus().getDisplayName(),
                itemCount,
                specification.getCreatedAt(),
                specification.getUpdatedAt()
        );
    }
}
