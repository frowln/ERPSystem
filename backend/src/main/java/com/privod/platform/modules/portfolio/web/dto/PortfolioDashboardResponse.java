package com.privod.platform.modules.portfolio.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record PortfolioDashboardResponse(
        long totalOpportunities,
        Map<String, Long> stageCounts,
        BigDecimal totalPipelineValue,
        long wonCount,
        long closedCount,
        BigDecimal winRate
) {
}
