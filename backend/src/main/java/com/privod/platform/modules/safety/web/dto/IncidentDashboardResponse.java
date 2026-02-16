package com.privod.platform.modules.safety.web.dto;

import java.util.Map;

public record IncidentDashboardResponse(
        long totalIncidents,
        Map<String, Long> severityCounts,
        Map<String, Long> typeCounts,
        Map<String, Long> statusCounts,
        int totalWorkDaysLost
) {
}
