package com.privod.platform.modules.analytics.web.dto;

public record SafetyMetricsResponse(
        long totalInspections,
        double passRate,
        long openViolations,
        long resolvedViolations,
        long incidentCount,
        double trainingComplianceRate,
        long daysSinceLastIncident
) {
}
