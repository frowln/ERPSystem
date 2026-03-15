package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.GuaranteeStatus;
import com.privod.platform.modules.finance.domain.GuaranteeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateBankGuaranteeRequest(
        UUID contractId,
        UUID counterpartyId,
        String bankName,
        String guaranteeNumber,
        GuaranteeType guaranteeType,
        BigDecimal amount,
        String currency,
        LocalDate issueDate,
        LocalDate expiryDate,
        GuaranteeStatus status,
        String documentUrl,
        String notes
) {
}
