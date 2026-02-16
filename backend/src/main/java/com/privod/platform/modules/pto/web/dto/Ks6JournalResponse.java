package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Ks6Journal;
import com.privod.platform.modules.pto.domain.Ks6JournalStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Ks6JournalResponse(
        UUID id,
        UUID projectId,
        LocalDate startDate,
        UUID responsibleEngineerId,
        Ks6JournalStatus status,
        String statusDisplayName,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static Ks6JournalResponse fromEntity(Ks6Journal entity) {
        return new Ks6JournalResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getStartDate(),
                entity.getResponsibleEngineerId(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
