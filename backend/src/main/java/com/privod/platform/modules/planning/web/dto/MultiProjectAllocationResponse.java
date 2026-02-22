package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.MultiProjectAllocation;
import com.privod.platform.modules.planning.domain.MultiProjectResourceType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MultiProjectAllocationResponse(
        UUID id,
        UUID organizationId,
        MultiProjectResourceType resourceType,
        String resourceTypeDisplayName,
        UUID resourceId,
        String resourceName,
        UUID projectId,
        String projectName,
        LocalDate startDate,
        LocalDate endDate,
        Integer allocationPercent,
        String role,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static MultiProjectAllocationResponse fromEntity(MultiProjectAllocation alloc,
                                                             String resourceName,
                                                             String projectName) {
        return new MultiProjectAllocationResponse(
                alloc.getId(),
                alloc.getOrganizationId(),
                alloc.getResourceType(),
                alloc.getResourceType() != null ? alloc.getResourceType().getDisplayName() : null,
                alloc.getResourceId(),
                resourceName,
                alloc.getProjectId(),
                projectName,
                alloc.getStartDate(),
                alloc.getEndDate(),
                alloc.getAllocationPercent(),
                alloc.getRole(),
                alloc.getNotes(),
                alloc.getCreatedAt(),
                alloc.getUpdatedAt()
        );
    }
}
