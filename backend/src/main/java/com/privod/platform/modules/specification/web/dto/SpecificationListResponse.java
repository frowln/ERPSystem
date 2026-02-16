package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;

import java.time.Instant;
import java.util.UUID;

public record SpecificationListResponse(
        UUID id,
        String name,
        UUID projectId,
        Integer docVersion,
        boolean isCurrent,
        SpecificationStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static SpecificationListResponse fromEntity(Specification specification) {
        return new SpecificationListResponse(
                specification.getId(),
                specification.getName(),
                specification.getProjectId(),
                specification.getDocVersion(),
                specification.isCurrent(),
                specification.getStatus(),
                specification.getStatus().getDisplayName(),
                specification.getCreatedAt(),
                specification.getUpdatedAt()
        );
    }
}
