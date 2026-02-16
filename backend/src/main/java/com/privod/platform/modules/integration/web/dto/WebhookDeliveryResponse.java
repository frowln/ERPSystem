package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

public record WebhookDeliveryResponse(
        UUID id,
        UUID webhookConfigId,
        String event,
        String payload,
        WebhookDeliveryStatus status,
        String statusDisplayName,
        Integer responseCode,
        String responseBody,
        int attemptCount,
        Instant nextRetryAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static WebhookDeliveryResponse fromEntity(WebhookDelivery entity) {
        return new WebhookDeliveryResponse(
                entity.getId(),
                entity.getWebhookConfigId(),
                entity.getEvent(),
                entity.getPayload(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResponseCode(),
                entity.getResponseBody(),
                entity.getAttemptCount(),
                entity.getNextRetryAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
