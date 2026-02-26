package com.privod.platform.modules.subscription.web.dto;

import com.privod.platform.modules.subscription.domain.BillingRecord;
import com.privod.platform.modules.subscription.domain.BillingType;
import com.privod.platform.modules.subscription.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BillingRecordResponse(
        UUID id,
        String planName,
        String planDisplayName,
        BigDecimal amount,
        String currency,
        BillingType billingType,
        String billingTypeDisplayName,
        PaymentStatus paymentStatus,
        String paymentStatusDisplayName,
        Instant invoiceDate,
        Instant paidDate,
        Instant periodStart,
        Instant periodEnd,
        String invoiceNumber,
        String description
) {
    public static BillingRecordResponse fromEntity(BillingRecord record) {
        return new BillingRecordResponse(
                record.getId(),
                record.getPlanName(),
                record.getPlanDisplayName(),
                record.getAmount(),
                record.getCurrency(),
                record.getBillingType(),
                record.getBillingType().getDisplayName(),
                record.getPaymentStatus(),
                record.getPaymentStatus().getDisplayName(),
                record.getInvoiceDate(),
                record.getPaidDate(),
                record.getPeriodStart(),
                record.getPeriodEnd(),
                record.getInvoiceNumber(),
                record.getDescription()
        );
    }
}
