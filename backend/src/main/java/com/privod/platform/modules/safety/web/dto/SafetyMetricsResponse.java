package com.privod.platform.modules.safety.web.dto;

import java.math.BigDecimal;

public record SafetyMetricsResponse(
        BigDecimal ltir,
        BigDecimal trir,
        long nearMisses,
        long firstAidCases,
        long totalIncidents,
        long totalInspections,
        long openViolations,
        BigDecimal trainingCompletionRate,
        long safeManHours,
        long daysWithoutIncident
) {
}
