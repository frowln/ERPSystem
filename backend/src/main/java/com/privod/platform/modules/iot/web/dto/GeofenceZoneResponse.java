package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.GeofenceZone;
import com.privod.platform.modules.iot.domain.GeofenceZoneType;

import java.time.Instant;
import java.util.UUID;

public record GeofenceZoneResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String name,
        GeofenceZoneType zoneType,
        String zoneTypeDisplayName,
        String polygonJson,
        Double radiusMeters,
        Double centerLat,
        Double centerLng,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static GeofenceZoneResponse fromEntity(GeofenceZone zone) {
        return new GeofenceZoneResponse(
                zone.getId(),
                zone.getOrganizationId(),
                zone.getProjectId(),
                zone.getName(),
                zone.getZoneType(),
                zone.getZoneType().getDisplayName(),
                zone.getPolygonJson(),
                zone.getRadiusMeters(),
                zone.getCenterLat(),
                zone.getCenterLng(),
                zone.isActive(),
                zone.getCreatedAt(),
                zone.getUpdatedAt(),
                zone.getCreatedBy()
        );
    }
}
