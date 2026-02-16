package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.SystemMetric;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SystemMetricResponse(
        UUID id,
        String metricName,
        Double metricValue,
        String metricUnit,
        Map<String, String> tags,
        Instant recordedAt
) {
    public static SystemMetricResponse fromEntity(SystemMetric m) {
        return new SystemMetricResponse(
                m.getId(),
                m.getMetricName(),
                m.getMetricValue(),
                m.getMetricUnit(),
                m.getTags(),
                m.getRecordedAt()
        );
    }
}
