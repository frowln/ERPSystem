package com.privod.platform.modules.analytics.web.dto;

import java.util.Map;

public record SafetyMetricsSummary(
        long totalIncidents,
        long openIncidents,
        long resolvedIncidents,
        Map<String, Long> bySeverity,
        long totalInspections,
        long completedInspections,
        long totalViolations,
        long openViolations,
        int totalWorkDaysLost
) {
}
