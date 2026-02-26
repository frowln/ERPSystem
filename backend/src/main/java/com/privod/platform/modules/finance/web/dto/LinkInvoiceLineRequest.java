package com.privod.platform.modules.finance.web.dto;

import java.util.UUID;

public record LinkInvoiceLineRequest(
        UUID budgetItemId,
        UUID cpItemId
) {
}
