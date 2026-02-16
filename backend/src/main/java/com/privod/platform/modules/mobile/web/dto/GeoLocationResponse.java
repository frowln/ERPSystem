package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.GeoLocation;

import java.time.Instant;
import java.util.UUID;

public record GeoLocationResponse(
        UUID id,
        UUID userId,
        Double latitude,
        Double longitude,
        Double accuracy,
        Double altitude,
        Instant recordedAt,
        UUID projectId,
        String entityType,
        UUID entityId,
        Instant createdAt
) {
    public static GeoLocationResponse fromEntity(GeoLocation entity) {
        return new GeoLocationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getAccuracy(),
                entity.getAltitude(),
                entity.getRecordedAt(),
                entity.getProjectId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getCreatedAt()
        );
    }
}
