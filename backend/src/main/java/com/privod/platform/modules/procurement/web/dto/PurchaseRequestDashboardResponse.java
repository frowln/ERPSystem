package com.privod.platform.modules.procurement.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record PurchaseRequestDashboardResponse(
        Map<String, Long> statusCounts,
        BigDecimal totalAmount
) {
}
