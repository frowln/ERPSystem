package com.privod.platform.modules.gpsTimesheet.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GpsCheckOutRequest(
        @NotNull UUID employeeId,
        @NotNull Double latitude,
        @NotNull Double longitude,
        Double accuracyMeters,
        String deviceId
) {
}
