package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.GeofenceAlert;
import com.privod.platform.modules.iot.domain.GeofenceAlertType;

import java.time.Instant;
import java.util.UUID;

public record GeofenceAlertResponse(
        UUID id,
        UUID organizationId,
        UUID deviceId,
        UUID zoneId,
        GeofenceAlertType alertType,
        String alertTypeDisplayName,
        Instant triggeredAt,
        Double latitude,
        Double longitude,
        boolean acknowledged,
        UUID acknowledgedBy,
        Instant acknowledgedAt,
        Instant createdAt
) {
    public static GeofenceAlertResponse fromEntity(GeofenceAlert alert) {
        return new GeofenceAlertResponse(
                alert.getId(),
                alert.getOrganizationId(),
                alert.getDeviceId(),
                alert.getZoneId(),
                alert.getAlertType(),
                alert.getAlertType().getDisplayName(),
                alert.getTriggeredAt(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.isAcknowledged(),
                alert.getAcknowledgedBy(),
                alert.getAcknowledgedAt(),
                alert.getCreatedAt()
        );
    }
}
