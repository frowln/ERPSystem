package com.privod.platform.modules.gpsTimesheet.web.dto;

import com.privod.platform.modules.gpsTimesheet.domain.SiteGeofence;

import java.time.Instant;
import java.util.UUID;

public record SiteGeofenceResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String name,
        double centerLatitude,
        double centerLongitude,
        double radiusMeters,
        String polygonJson,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SiteGeofenceResponse fromEntity(SiteGeofence entity) {
        return new SiteGeofenceResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getCenterLatitude(),
                entity.getCenterLongitude(),
                entity.getRadiusMeters(),
                entity.getPolygonJson(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
