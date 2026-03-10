package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record ProcurementSpendResponse(
        String category,
        BigDecimal planned,
        BigDecimal actual
) {
}
