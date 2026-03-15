package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BankGuarantee;
import com.privod.platform.modules.finance.domain.GuaranteeStatus;
import com.privod.platform.modules.finance.domain.GuaranteeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BankGuaranteeResponse(
        UUID id,
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
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static BankGuaranteeResponse fromEntity(BankGuarantee bg) {
        return new BankGuaranteeResponse(
                bg.getId(),
                bg.getContractId(),
                bg.getCounterpartyId(),
                bg.getBankName(),
                bg.getGuaranteeNumber(),
                bg.getGuaranteeType(),
                bg.getAmount(),
                bg.getCurrency(),
                bg.getIssueDate(),
                bg.getExpiryDate(),
                bg.getStatus(),
                bg.getDocumentUrl(),
                bg.getNotes(),
                bg.getCreatedAt(),
                bg.getUpdatedAt()
        );
    }
}
