package com.privod.platform.modules.project.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ProjectDashboardResponse(
        long totalProjects,
        Map<String, Long> statusCounts,
        /** Sum of manual (preliminary) budgetAmount across all active projects */
        BigDecimal totalBudget,
        /** Sum of manual (preliminary) contractAmount across all active projects */
        BigDecimal totalContractAmount,
        /** Computed: sum of GENERAL contract amounts across all active projects */
        BigDecimal computedTotalContractAmount,
        /** Computed: sum of planned budgets (cost codes / budgets) across all active projects */
        BigDecimal computedTotalPlannedBudget,
        /** Computed: sum of actual cost (paid to suppliers) across all active projects */
        BigDecimal computedTotalActualCost,
        /** Computed: total received payments - total paid to suppliers */
        BigDecimal computedTotalCashFlow
) {
}
