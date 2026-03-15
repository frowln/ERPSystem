package com.privod.platform.modules.subscription.web.dto;

import java.math.BigDecimal;

public record BankInvoiceResponse(
        String id,
        String invoiceNumber,
        BigDecimal amount,
        String currency,
        String status,
        String buyerName,
        String buyerInn,
        String buyerKpp,
        String buyerAddress,
        String sellerName,
        String sellerInn,
        String sellerKpp,
        String sellerBankAccount,
        String sellerBankBik,
        String sellerBankName,
        String createdAt,
        String paidAt
) {}
