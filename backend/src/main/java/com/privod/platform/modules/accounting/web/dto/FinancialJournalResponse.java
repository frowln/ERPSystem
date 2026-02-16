package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.FinancialJournal;
import com.privod.platform.modules.accounting.domain.JournalType;

import java.time.Instant;
import java.util.UUID;

public record FinancialJournalResponse(
        UUID id,
        String code,
        String name,
        JournalType journalType,
        String journalTypeDisplayName,
        boolean active,
        Instant createdAt
) {
    public static FinancialJournalResponse fromEntity(FinancialJournal journal) {
        return new FinancialJournalResponse(
                journal.getId(),
                journal.getCode(),
                journal.getName(),
                journal.getJournalType(),
                journal.getJournalType().getDisplayName(),
                journal.isActive(),
                journal.getCreatedAt()
        );
    }
}
