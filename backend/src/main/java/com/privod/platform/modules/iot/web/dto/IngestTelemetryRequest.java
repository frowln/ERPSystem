package com.privod.platform.modules.iot.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record IngestTelemetryRequest(
        @NotNull(message = "ID устройства обязателен")
        UUID deviceId,

        Instant recordedAt,

        Double latitude,
        Double longitude,
        Double altitude,
        Double speed,
        Double heading,
        Double engineHours,
        Double fuelLevelPercent,
        Double fuelConsumedLiters,
        Double temperature,
        Double batteryLevel,
        String rawPayloadJson
) {
}
