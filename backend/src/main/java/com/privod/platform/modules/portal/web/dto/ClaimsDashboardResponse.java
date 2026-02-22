package com.privod.platform.modules.portal.web.dto;

import java.util.Map;

public record ClaimsDashboardResponse(
        long totalClaims,
        long openClaims,
        long assignedClaims,
        long overdueCount,
        Double avgResolutionDays,
        Map<String, Long> byCategoryMap,
        Map<String, Long> byStatusMap,
        Map<String, Long> byPriorityMap
) {
}
