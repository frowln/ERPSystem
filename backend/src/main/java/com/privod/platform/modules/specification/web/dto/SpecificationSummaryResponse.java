package com.privod.platform.modules.specification.web.dto;

import java.math.BigDecimal;

public record SpecificationSummaryResponse(
        long totalItems,
        long materialCount,
        long equipmentCount,
        long workCount,
        BigDecimal totalPlannedAmount,
        BigDecimal materialPlannedAmount,
        BigDecimal equipmentPlannedAmount,
        BigDecimal workPlannedAmount
) {
}
