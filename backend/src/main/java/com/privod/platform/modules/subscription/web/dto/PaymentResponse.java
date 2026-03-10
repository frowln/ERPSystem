package com.privod.platform.modules.subscription.web.dto;

public record PaymentResponse(
        String billingRecordId,
        String confirmationUrl,
        String yookassaPaymentId,
        String status
) {}
