package com.privod.platform.modules.gpsTimesheet.web.dto;

import com.privod.platform.modules.gpsTimesheet.domain.CheckEventType;
import com.privod.platform.modules.gpsTimesheet.domain.GpsCheckEvent;

import java.time.Instant;
import java.util.UUID;

public record GpsCheckEventResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        UUID projectId,
        UUID siteGeofenceId,
        CheckEventType eventType,
        double latitude,
        double longitude,
        Double accuracyMeters,
        boolean isWithinGeofence,
        String deviceId,
        Instant recordedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static GpsCheckEventResponse fromEntity(GpsCheckEvent entity) {
        return new GpsCheckEventResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getEmployeeId(),
                entity.getProjectId(),
                entity.getSiteGeofenceId(),
                entity.getEventType(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getAccuracyMeters(),
                entity.isWithinGeofence(),
                entity.getDeviceId(),
                entity.getRecordedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
