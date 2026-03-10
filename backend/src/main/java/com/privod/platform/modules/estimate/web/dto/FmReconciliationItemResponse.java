package com.privod.platform.modules.estimate.web.dto;

import java.math.BigDecimal;

public record FmReconciliationItemResponse(
        String section,
        BigDecimal estimateTotal,
        BigDecimal fmTotal,
        BigDecimal delta,
        BigDecimal deltaPercent
) {
}
