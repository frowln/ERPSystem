package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.PhotoProgress;
import com.privod.platform.modules.bim.domain.WeatherCondition;

import java.time.Instant;
import java.util.UUID;

public record PhotoProgressResponse(
        UUID id,
        UUID projectId,
        String title,
        String location,
        String photoUrl,
        String thumbnailUrl,
        Double latitude,
        Double longitude,
        Instant takenAt,
        UUID takenById,
        WeatherCondition weatherCondition,
        String weatherConditionDisplayName,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PhotoProgressResponse fromEntity(PhotoProgress entity) {
        return new PhotoProgressResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getTitle(),
                entity.getLocation(),
                entity.getPhotoUrl(),
                entity.getThumbnailUrl(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getTakenAt(),
                entity.getTakenById(),
                entity.getWeatherCondition(),
                entity.getWeatherCondition() != null ? entity.getWeatherCondition().getDisplayName() : null,
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
