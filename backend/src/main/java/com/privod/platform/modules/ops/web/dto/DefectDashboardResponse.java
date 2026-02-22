package com.privod.platform.modules.ops.web.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DefectDashboardResponse(
        long totalOpen,
        long totalOverdue,
        Double avgResolutionHours,
        Map<String, Long> bySeverity,
        List<GroupStats> byContractor,
        List<GroupStats> byProject
) {
    public record GroupStats(
            UUID id,
            String name,
            long open,
            long inProgress,
            long fixed,
            long verified,
            long total
    ) {}
}
