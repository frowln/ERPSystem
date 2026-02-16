package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record InvoiceSummaryResponse(
        long totalInvoices,
        BigDecimal totalIssued,
        BigDecimal totalReceived,
        long overdueCount,
        BigDecimal overdueAmount
) {
}
