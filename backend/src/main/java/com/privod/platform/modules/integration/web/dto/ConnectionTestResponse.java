package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.HealthStatus;

import java.time.Instant;

public record ConnectionTestResponse(
        boolean success,
        HealthStatus healthStatus,
        String healthStatusDisplayName,
        String message,
        long responseTimeMs,
        Instant testedAt
) {
}
