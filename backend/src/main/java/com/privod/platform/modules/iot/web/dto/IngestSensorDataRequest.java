package com.privod.platform.modules.iot.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record IngestSensorDataRequest(
        @NotNull(message = "Device ID is required")
        UUID deviceId,

        Instant timestamp,

        @NotBlank(message = "Metric name is required")
        String metricName,

        @NotNull(message = "Metric value is required")
        Double metricValue,

        String unit
) {
}
