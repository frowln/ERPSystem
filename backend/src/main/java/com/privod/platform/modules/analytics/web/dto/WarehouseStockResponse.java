package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record WarehouseStockResponse(
        String category,
        String label,
        long currentStock,
        long minStock,
        long maxStock,
        BigDecimal value
) {
}
