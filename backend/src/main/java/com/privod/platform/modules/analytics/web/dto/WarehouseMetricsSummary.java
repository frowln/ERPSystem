package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record WarehouseMetricsSummary(
        long totalMaterials,
        long lowStockItems,
        long outOfStockItems,
        BigDecimal totalStockValue,
        long totalMovements,
        long incomingMovements,
        long outgoingMovements
) {
}
