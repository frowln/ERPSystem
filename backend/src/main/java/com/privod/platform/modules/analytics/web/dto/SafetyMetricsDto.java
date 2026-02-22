package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SafetyMetricsDto(
        long totalIncidents,
        BigDecimal trir,
        long daysSinceLastIncident,
        Map<String, Long> severityBreakdown
) {
}
