package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.WebhookEndpoint;

import java.time.Instant;
import java.util.UUID;

public record WebhookEndpointResponse(
        UUID id,
        String code,
        String url,
        String events,
        boolean isActive,
        Instant lastTriggeredAt,
        int failureCount,
        String lastFailureReason,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WebhookEndpointResponse fromEntity(WebhookEndpoint entity) {
        return new WebhookEndpointResponse(
                entity.getId(),
                entity.getCode(),
                entity.getUrl(),
                entity.getEvents(),
                entity.isActive(),
                entity.getLastTriggeredAt(),
                entity.getFailureCount(),
                entity.getLastFailureReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
