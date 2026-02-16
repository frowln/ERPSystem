package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SpecificationResponse(
        UUID id,
        String name,
        UUID projectId,
        UUID contractId,
        Integer docVersion,
        boolean isCurrent,
        SpecificationStatus status,
        String statusDisplayName,
        UUID parentVersionId,
        String notes,
        List<SpecItemResponse> items,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SpecificationResponse fromEntity(Specification specification) {
        return fromEntity(specification, null);
    }

    public static SpecificationResponse fromEntity(Specification specification, List<SpecItemResponse> items) {
        return new SpecificationResponse(
                specification.getId(),
                specification.getName(),
                specification.getProjectId(),
                specification.getContractId(),
                specification.getDocVersion(),
                specification.isCurrent(),
                specification.getStatus(),
                specification.getStatus().getDisplayName(),
                specification.getParentVersionId(),
                specification.getNotes(),
                items,
                specification.getCreatedAt(),
                specification.getUpdatedAt(),
                specification.getCreatedBy()
        );
    }
}
