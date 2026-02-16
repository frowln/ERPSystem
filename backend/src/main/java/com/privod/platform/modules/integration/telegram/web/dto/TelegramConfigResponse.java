package com.privod.platform.modules.integration.telegram.web.dto;

import com.privod.platform.modules.integration.telegram.domain.TelegramConfig;

import java.time.Instant;
import java.util.UUID;

public record TelegramConfigResponse(
        UUID id,
        String botUsername,
        String webhookUrl,
        boolean enabled,
        String chatIds,
        UUID organizationId,
        boolean hasToken,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TelegramConfigResponse fromEntity(TelegramConfig entity) {
        return new TelegramConfigResponse(
                entity.getId(),
                entity.getBotUsername(),
                entity.getWebhookUrl(),
                entity.isEnabled(),
                entity.getChatIds(),
                entity.getOrganizationId(),
                entity.getBotToken() != null && !entity.getBotToken().isBlank(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
