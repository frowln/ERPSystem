package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.MultiProjectResourceType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AllocationConflictResponse(
        UUID resourceId,
        String resourceName,
        MultiProjectResourceType resourceType,
        List<ConflictProject> projects,
        LocalDate overlapStart,
        LocalDate overlapEnd,
        Integer totalPercent
) {
    public record ConflictProject(
            UUID projectId,
            String projectName,
            Integer percent
    ) {
    }
}
