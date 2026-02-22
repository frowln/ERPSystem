package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.IotTelemetryPoint;

import java.time.Instant;
import java.util.UUID;

public record IotTelemetryPointResponse(
        UUID id,
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
        Instant createdAt
) {
    public static IotTelemetryPointResponse fromEntity(IotTelemetryPoint point) {
        return new IotTelemetryPointResponse(
                point.getId(),
                point.getDeviceId(),
                point.getRecordedAt(),
                point.getLatitude(),
                point.getLongitude(),
                point.getAltitude(),
                point.getSpeed(),
                point.getHeading(),
                point.getEngineHours(),
                point.getFuelLevelPercent(),
                point.getFuelConsumedLiters(),
                point.getTemperature(),
                point.getBatteryLevel(),
                point.getCreatedAt()
        );
    }
}
