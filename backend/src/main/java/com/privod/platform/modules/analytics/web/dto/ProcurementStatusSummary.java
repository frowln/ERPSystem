package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ProcurementStatusSummary(
        long totalOrders,
        Map<String, Long> byStatus,
        BigDecimal totalSpend,
        BigDecimal averageOrderValue,
        long pendingOrders,
        long overdueOrders
) {
}
