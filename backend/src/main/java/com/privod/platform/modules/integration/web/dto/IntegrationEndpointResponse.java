package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.AuthType;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;

import java.time.Instant;
import java.util.UUID;

public record IntegrationEndpointResponse(
        UUID id,
        String code,
        String name,
        IntegrationProvider provider,
        String providerDisplayName,
        String baseUrl,
        AuthType authType,
        String authTypeDisplayName,
        boolean isActive,
        Instant lastHealthCheck,
        HealthStatus healthStatus,
        String healthStatusDisplayName,
        int rateLimitPerMinute,
        int timeoutMs,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IntegrationEndpointResponse fromEntity(IntegrationEndpoint entity) {
        return new IntegrationEndpointResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getProvider(),
                entity.getProvider().getDisplayName(),
                entity.getBaseUrl(),
                entity.getAuthType(),
                entity.getAuthType().getDisplayName(),
                entity.isActive(),
                entity.getLastHealthCheck(),
                entity.getHealthStatus(),
                entity.getHealthStatus().getDisplayName(),
                entity.getRateLimitPerMinute(),
                entity.getTimeoutMs(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
