package com.privod.platform.modules.crm.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record CrmPipelineResponse(
        long totalLeads,
        Map<String, Long> statusCounts,
        Map<String, Long> stageCounts,
        BigDecimal pipelineRevenue,
        BigDecimal weightedPipelineRevenue,
        BigDecimal wonRevenue,
        long openLeads,
        long wonLeads,
        long lostLeads
) {
}
