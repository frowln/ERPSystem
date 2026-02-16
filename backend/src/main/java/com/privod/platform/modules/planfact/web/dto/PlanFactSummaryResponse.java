package com.privod.platform.modules.planfact.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanFactSummaryResponse(
        UUID projectId,
        BigDecimal planRevenue,
        BigDecimal factRevenue,
        BigDecimal revenueVariance,
        BigDecimal planCost,
        BigDecimal factCost,
        BigDecimal costVariance,
        BigDecimal planMargin,
        BigDecimal factMargin,
        BigDecimal marginVariance
) {
}
