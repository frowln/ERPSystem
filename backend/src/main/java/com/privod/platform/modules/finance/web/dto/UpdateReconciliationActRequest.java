package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateReconciliationActRequest(
        UUID counterpartyId,
        UUID contractId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal ourDebit,
        BigDecimal ourCredit,
        BigDecimal counterpartyDebit,
        BigDecimal counterpartyCredit,
        String notes
) {
}
