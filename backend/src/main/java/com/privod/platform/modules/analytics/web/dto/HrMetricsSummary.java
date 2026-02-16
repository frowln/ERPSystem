package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record HrMetricsSummary(
        long totalEmployees,
        long activeEmployees,
        long totalCrews,
        BigDecimal crewUtilizationPercent,
        BigDecimal totalTimesheetHours,
        BigDecimal averageHoursPerEmployee
) {
}
