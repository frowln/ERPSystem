package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.DailyLogEntry;
import com.privod.platform.modules.dailylog.domain.EntryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

public record DailyLogEntryResponse(
        UUID id,
        UUID dailyLogId,
        EntryType entryType,
        String entryTypeDisplayName,
        String description,
        BigDecimal quantity,
        String unit,
        LocalTime startTime,
        LocalTime endTime,
        String responsibleName,
        UUID taskId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DailyLogEntryResponse fromEntity(DailyLogEntry entity) {
        return new DailyLogEntryResponse(
                entity.getId(),
                entity.getDailyLogId(),
                entity.getEntryType(),
                entity.getEntryType().getDisplayName(),
                entity.getDescription(),
                entity.getQuantity(),
                entity.getUnit(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getResponsibleName(),
                entity.getTaskId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
