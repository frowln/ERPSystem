package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.AccountEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AccountEntryResponse(
        UUID id,
        UUID journalId,
        UUID debitAccountId,
        UUID creditAccountId,
        BigDecimal amount,
        LocalDate entryDate,
        String description,
        String documentType,
        UUID documentId,
        UUID periodId,
        Instant createdAt,
        String createdBy
) {
    public static AccountEntryResponse fromEntity(AccountEntry entity) {
        return new AccountEntryResponse(
                entity.getId(),
                entity.getJournalId(),
                entity.getDebitAccountId(),
                entity.getCreditAccountId(),
                entity.getAmount(),
                entity.getEntryDate(),
                entity.getDescription(),
                entity.getDocumentType(),
                entity.getDocumentId(),
                entity.getPeriodId(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
