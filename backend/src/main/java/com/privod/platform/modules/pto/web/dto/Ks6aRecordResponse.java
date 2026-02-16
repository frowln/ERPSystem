package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Ks6aRecord;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Ks6aRecordResponse(
        UUID id,
        UUID ks6JournalId,
        String monthYear,
        String workName,
        String unit,
        BigDecimal plannedVolume,
        BigDecimal first10days,
        BigDecimal second10days,
        BigDecimal third10days,
        BigDecimal totalActual,
        String notes,
        Instant createdAt,
        String createdBy
) {
    public static Ks6aRecordResponse fromEntity(Ks6aRecord entity) {
        return new Ks6aRecordResponse(
                entity.getId(),
                entity.getKs6JournalId(),
                entity.getMonthYear(),
                entity.getWorkName(),
                entity.getUnit(),
                entity.getPlannedVolume(),
                entity.getFirst10days(),
                entity.getSecond10days(),
                entity.getThird10days(),
                entity.getTotalActual(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
