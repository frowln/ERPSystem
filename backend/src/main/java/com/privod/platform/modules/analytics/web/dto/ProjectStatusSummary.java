package com.privod.platform.modules.analytics.web.dto;

import java.util.Map;

public record ProjectStatusSummary(
        long totalProjects,
        Map<String, Long> byStatus,
        long activeProjects,
        long completedProjects,
        long overdueProjects
) {
}
