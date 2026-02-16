package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.RetryPolicy;
import com.privod.platform.modules.apiManagement.domain.WebhookConfig;

import java.time.Instant;
import java.util.UUID;

public record WebhookConfigResponse(
        UUID id,
        String name,
        String url,
        String events,
        boolean isActive,
        Instant lastTriggeredAt,
        int failureCount,
        Instant lastFailureAt,
        String lastFailureMessage,
        RetryPolicy retryPolicy,
        String retryPolicyDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static WebhookConfigResponse fromEntity(WebhookConfig config) {
        return new WebhookConfigResponse(
                config.getId(),
                config.getName(),
                config.getUrl(),
                config.getEvents(),
                config.isActive(),
                config.getLastTriggeredAt(),
                config.getFailureCount(),
                config.getLastFailureAt(),
                config.getLastFailureMessage(),
                config.getRetryPolicy(),
                config.getRetryPolicy().getDisplayName(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
