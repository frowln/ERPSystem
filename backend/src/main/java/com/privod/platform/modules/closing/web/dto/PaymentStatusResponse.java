package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PaymentStatusResponse(
        UUID ks2Id,
        String ks2Number,
        BigDecimal ks2Amount,
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal remainingAmount,
        BigDecimal paymentPercent,
        String paymentStatus,
        List<LinkedInvoiceSummary> invoices
) {

    public record LinkedInvoiceSummary(
            UUID invoiceId,
            String invoiceNumber,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            String status
    ) {
    }
}
