package com.privod.platform.modules.safety.web.dto;

import java.util.Map;

public record ViolationDashboardResponse(
        long totalViolations,
        long overdueViolations,
        Map<String, Long> severityCounts,
        Map<String, Long> statusCounts
) {
}
