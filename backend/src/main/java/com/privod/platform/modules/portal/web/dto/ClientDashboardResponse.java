package com.privod.platform.modules.portal.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record ClientDashboardResponse(
        String projectName,
        BigDecimal overallPercent,
        List<ClientMilestoneResponse> latestMilestones,
        long pendingSignatures,
        List<String> recentPhotos,
        FinancialSummary financialSummary
) {
    public record FinancialSummary(
            BigDecimal totalContract,
            BigDecimal totalInvoiced,
            BigDecimal totalPaid
    ) {
    }
}
