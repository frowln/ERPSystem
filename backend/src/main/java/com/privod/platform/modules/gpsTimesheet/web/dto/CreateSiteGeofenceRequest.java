package com.privod.platform.modules.gpsTimesheet.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CreateSiteGeofenceRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @NotNull Double centerLatitude,
        @NotNull Double centerLongitude,
        @Positive Double radiusMeters,
        String polygonJson
) {
}
