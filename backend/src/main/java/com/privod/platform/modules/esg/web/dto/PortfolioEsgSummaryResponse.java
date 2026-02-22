package com.privod.platform.modules.esg.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioEsgSummaryResponse(
        int projectCount,
        BigDecimal totalCarbonFootprint,
        BigDecimal totalEnergyKwh,
        BigDecimal totalWasteTons,
        BigDecimal totalWaterM3,
        BigDecimal avgCarbonPerSqm,
        BigDecimal avgWasteDiversionRate,
        List<ProjectCarbonFootprintResponse> projectFootprints
) {}
