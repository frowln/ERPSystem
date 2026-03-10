package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BankTransactionResponse(
        UUID id,
        LocalDate date,
        String description,
        BigDecimal amount,
        String direction,
        String counterpartyName,
        String counterpartyInn,
        String counterpartyAccount,
        String paymentPurpose,
        String status,
        UUID matchedInvoiceId,
        String matchedInvoiceNumber
) {
}
