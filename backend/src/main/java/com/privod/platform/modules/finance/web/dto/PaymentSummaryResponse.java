package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record PaymentSummaryResponse(
        long totalPayments,
        BigDecimal totalIncoming,
        BigDecimal totalOutgoing,
        BigDecimal netCashFlow
) {
}
