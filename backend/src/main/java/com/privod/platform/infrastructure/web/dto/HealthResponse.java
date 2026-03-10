package com.privod.platform.infrastructure.web.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Response DTO for health-check endpoints.
 *
 * @param status    overall status: "UP", "DOWN", or "DEGRADED"
 * @param version   API version string
 * @param timestamp time of the health check
 * @param details   optional per-subsystem details (e.g. database, redis)
 */
public record HealthResponse(
        String status,
        String version,
        Instant timestamp,
        Map<String, Object> details
) {
}
