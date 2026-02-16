package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.ResourceAllocation;
import com.privod.platform.modules.planning.domain.ResourceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ResourceAllocationResponse(
        UUID id,
        UUID wbsNodeId,
        ResourceType resourceType,
        String resourceTypeDisplayName,
        UUID resourceId,
        String resourceName,
        BigDecimal plannedUnits,
        BigDecimal actualUnits,
        BigDecimal unitRate,
        BigDecimal plannedCost,
        BigDecimal actualCost,
        LocalDate startDate,
        LocalDate endDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResourceAllocationResponse fromEntity(ResourceAllocation alloc) {
        return new ResourceAllocationResponse(
                alloc.getId(),
                alloc.getWbsNodeId(),
                alloc.getResourceType(),
                alloc.getResourceType() != null ? alloc.getResourceType().getDisplayName() : null,
                alloc.getResourceId(),
                alloc.getResourceName(),
                alloc.getPlannedUnits(),
                alloc.getActualUnits(),
                alloc.getUnitRate(),
                alloc.getPlannedCost(),
                alloc.getActualCost(),
                alloc.getStartDate(),
                alloc.getEndDate(),
                alloc.getCreatedAt(),
                alloc.getUpdatedAt()
        );
    }
}
