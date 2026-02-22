package com.privod.platform.modules.costManagement.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ProfitabilityPortfolioResponse(
        int totalProjects,
        BigDecimal totalContractValue,
        BigDecimal totalForecastMargin,
        BigDecimal avgMarginPercent,
        BigDecimal totalProfitFade,
        int projectsAtRisk,
        int lossProjects,
        Map<String, Integer> byRiskLevel
) {
}
