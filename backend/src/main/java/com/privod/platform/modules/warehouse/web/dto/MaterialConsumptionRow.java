package com.privod.platform.modules.warehouse.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * P1-WAR-2: One row in the plan vs actual material consumption report.
 */
public record MaterialConsumptionRow(
        /** Material name (from estimate line or stock movement line) */
        String materialName,
        /** Material ID if matched in warehouse catalog */
        UUID materialId,
        /** Unit of measure */
        String unit,
        /** Planned quantity (from LocalEstimateLine) — null if no estimate line found */
        BigDecimal plannedQty,
        /** Planned material cost (базовая) */
        BigDecimal plannedCost,
        /** Actual quantity consumed (from StockMovement CONSUMPTION) */
        BigDecimal actualQty,
        /** Deviation = actual - planned */
        BigDecimal deviation,
        /** Deviation as % of planned (null if plannedQty == 0) */
        BigDecimal deviationPct
) {
}
