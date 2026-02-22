package com.privod.platform.modules.finance.web.dto;

import java.util.UUID;

public record InvoiceMatchCandidate(
        UUID invoiceLineId,
        String invoiceLineName,
        UUID budgetItemId,
        String budgetItemName,
        int confidence,
        String description
) {
}
