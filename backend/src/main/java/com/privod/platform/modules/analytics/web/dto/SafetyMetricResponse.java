package com.privod.platform.modules.analytics.web.dto;

public record SafetyMetricResponse(
        String month,
        long incidents,
        long nearMisses,
        long inspections,
        long daysWithoutIncident
) {
}
