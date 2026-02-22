package com.privod.platform.modules.analytics.web.dto;

import java.util.List;

public record ExecutiveDashboardResponse(
        PortfolioSummaryDto portfolioSummary,
        List<ProjectHealthDto> projectHealth,
        CashPositionDto cashPosition,
        SafetyMetricsDto safetyMetrics,
        ResourceUtilizationDto resourceUtilization
) {
}
