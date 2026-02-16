package com.privod.platform.modules.journal.web.dto;

import com.privod.platform.modules.journal.domain.GeneralJournalEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JournalEntryResponse(
        UUID id,
        UUID journalId,
        LocalDate date,
        String section,
        String workDescription,
        BigDecimal volume,
        String unit,
        String crew,
        String weatherConditions,
        String notes,
        Instant createdAt,
        String createdBy
) {
    public static JournalEntryResponse fromEntity(GeneralJournalEntry entity) {
        return new JournalEntryResponse(
                entity.getId(),
                entity.getJournalId(),
                entity.getDate(),
                entity.getSection(),
                entity.getWorkDescription(),
                entity.getVolume(),
                entity.getUnit(),
                entity.getCrew(),
                entity.getWeatherConditions(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
