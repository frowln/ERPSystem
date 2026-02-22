package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record FmDashboardResponse(
        UUID budgetId,
        BigDecimal totalCost,
        BigDecimal totalCustomer,
        BigDecimal margin,
        BigDecimal marginPercent,
        BigDecimal totalContracted,
        BigDecimal totalActSigned,
        BigDecimal totalPaid,
        List<FmSectionSummary> sections,
        List<FmRiskPosition> riskPositions
) {
}
