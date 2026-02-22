package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ThreeWayMatchResult(
        UUID invoiceId,
        BigDecimal overallConfidence,
        boolean hasPurchaseOrder,
        boolean hasReceipt,
        boolean linesMatchTotal,
        List<Discrepancy> discrepancies
) {
    public record Discrepancy(
            String type,
            String description,
            BigDecimal expected,
            BigDecimal actual,
            BigDecimal difference
    ) {
    }
}
