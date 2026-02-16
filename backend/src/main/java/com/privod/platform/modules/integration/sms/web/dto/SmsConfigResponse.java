package com.privod.platform.modules.integration.sms.web.dto;

import com.privod.platform.modules.integration.sms.domain.SmsConfig;
import com.privod.platform.modules.integration.sms.domain.SmsProvider;

import java.time.Instant;
import java.util.UUID;

public record SmsConfigResponse(
        UUID id,
        SmsProvider provider,
        String providerDisplayName,
        String apiUrl,
        String senderName,
        boolean enabled,
        boolean whatsappEnabled,
        boolean apiKeyConfigured,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SmsConfigResponse fromEntity(SmsConfig entity) {
        return new SmsConfigResponse(
                entity.getId(),
                entity.getProvider(),
                entity.getProvider().getDisplayName(),
                entity.getApiUrl(),
                entity.getSenderName(),
                entity.isEnabled(),
                entity.isWhatsappEnabled(),
                entity.getApiKey() != null && !entity.getApiKey().isBlank(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
