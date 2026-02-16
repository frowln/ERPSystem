package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.HealthComponent;
import com.privod.platform.modules.monitoring.domain.HealthStatus;
import com.privod.platform.modules.monitoring.domain.SystemHealthCheck;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record HealthCheckResponse(
        UUID id,
        HealthComponent component,
        String componentDisplayName,
        HealthStatus status,
        String statusDisplayName,
        Long responseTimeMs,
        String message,
        Map<String, Object> details,
        Instant checkedAt
) {
    public static HealthCheckResponse fromEntity(SystemHealthCheck hc) {
        return new HealthCheckResponse(
                hc.getId(),
                hc.getComponent(),
                hc.getComponent().getDisplayName(),
                hc.getStatus(),
                hc.getStatus().getDisplayName(),
                hc.getResponseTimeMs(),
                hc.getMessage(),
                hc.getDetails(),
                hc.getCheckedAt()
        );
    }
}
