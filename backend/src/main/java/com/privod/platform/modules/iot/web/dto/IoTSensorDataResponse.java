package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.IoTSensorData;

import java.time.Instant;
import java.util.UUID;

public record IoTSensorDataResponse(
        UUID id,
        UUID deviceId,
        Instant timestamp,
        String metricName,
        Double metricValue,
        String unit,
        Boolean isAnomaly,
        Instant createdAt
) {
    public static IoTSensorDataResponse fromEntity(IoTSensorData entity) {
        return new IoTSensorDataResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getTimestamp(),
                entity.getMetricName(),
                entity.getMetricValue(),
                entity.getUnit(),
                entity.getIsAnomaly(),
                entity.getCreatedAt()
        );
    }
}
