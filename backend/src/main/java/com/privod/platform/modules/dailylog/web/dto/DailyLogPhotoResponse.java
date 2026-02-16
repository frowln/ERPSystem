package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.DailyLogPhoto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DailyLogPhotoResponse(
        UUID id,
        UUID dailyLogId,
        String photoUrl,
        String thumbnailUrl,
        String caption,
        Instant takenAt,
        UUID takenById,
        BigDecimal gpsLatitude,
        BigDecimal gpsLongitude,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DailyLogPhotoResponse fromEntity(DailyLogPhoto entity) {
        return new DailyLogPhotoResponse(
                entity.getId(),
                entity.getDailyLogId(),
                entity.getPhotoUrl(),
                entity.getThumbnailUrl(),
                entity.getCaption(),
                entity.getTakenAt(),
                entity.getTakenById(),
                entity.getGpsLatitude(),
                entity.getGpsLongitude(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
