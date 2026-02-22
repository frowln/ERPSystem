package com.privod.platform.modules.gpsTimesheet.web.dto;

import java.util.UUID;

public record UpdateSiteGeofenceRequest(
        UUID projectId,
        String name,
        Double centerLatitude,
        Double centerLongitude,
        Double radiusMeters,
        String polygonJson,
        Boolean isActive
) {
}
