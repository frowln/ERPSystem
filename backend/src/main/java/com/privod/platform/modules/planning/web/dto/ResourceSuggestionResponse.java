package com.privod.platform.modules.planning.web.dto;

import java.util.List;
import java.util.UUID;

public record ResourceSuggestionResponse(
        UUID resourceId,
        String resourceName,
        String position,
        List<String> skills,
        List<String> certifications,
        List<CurrentAllocationInfo> currentAllocations,
        Integer availabilityPercent
) {
    public record CurrentAllocationInfo(
            UUID projectId,
            String projectName,
            Integer allocationPercent
    ) {
    }
}
