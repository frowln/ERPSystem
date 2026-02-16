package com.privod.platform.modules.journal.web.dto;

import com.privod.platform.modules.journal.domain.GeneralJournal;
import com.privod.platform.modules.journal.domain.JournalStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JournalResponse(
        UUID id,
        UUID projectId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        JournalStatus status,
        String statusDisplayName,
        UUID responsibleId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static JournalResponse fromEntity(GeneralJournal entity) {
        return new JournalResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResponsibleId(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
