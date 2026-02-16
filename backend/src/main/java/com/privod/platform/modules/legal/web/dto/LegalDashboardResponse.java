package com.privod.platform.modules.legal.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record LegalDashboardResponse(
        long totalCases,
        Map<String, Long> statusCounts,
        BigDecimal totalActiveClaimsAmount,
        long openCases,
        long closedCases
) {
}
