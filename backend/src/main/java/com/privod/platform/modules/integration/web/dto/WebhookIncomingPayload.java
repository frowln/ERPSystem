package com.privod.platform.modules.integration.web.dto;

public record WebhookIncomingPayload(
        String eventType,
        String payload,
        String signature
) {
}
