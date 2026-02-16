package com.privod.platform.modules.apiManagement.web.dto;

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
        Instant sentAt,
        Instant deliveredAt,
        int attemptCount,
        Instant nextRetryAt,
        Instant createdAt
) {
    public static WebhookDeliveryResponse fromEntity(WebhookDelivery delivery) {
        return new WebhookDeliveryResponse(
                delivery.getId(),
                delivery.getWebhookConfigId(),
                delivery.getEvent(),
                delivery.getPayload(),
                delivery.getStatus(),
                delivery.getStatus().getDisplayName(),
                delivery.getResponseCode(),
                delivery.getResponseBody(),
                delivery.getSentAt(),
                delivery.getDeliveredAt(),
                delivery.getAttemptCount(),
                delivery.getNextRetryAt(),
                delivery.getCreatedAt()
        );
    }
}
