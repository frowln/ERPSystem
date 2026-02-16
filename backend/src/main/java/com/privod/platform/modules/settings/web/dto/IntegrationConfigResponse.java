package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.IntegrationConfig;
import com.privod.platform.modules.settings.domain.IntegrationType;
import com.privod.platform.modules.settings.domain.SyncStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record IntegrationConfigResponse(
        UUID id,
        String code,
        String name,
        IntegrationType integrationType,
        String integrationTypeDisplayName,
        String baseUrl,
        boolean hasApiKey,
        boolean hasApiSecret,
        boolean isActive,
        Instant lastSyncAt,
        SyncStatus syncStatus,
        String syncStatusDisplayName,
        Map<String, Object> configJson,
        Instant createdAt,
        Instant updatedAt
) {
    public static IntegrationConfigResponse fromEntity(IntegrationConfig config) {
        return new IntegrationConfigResponse(
                config.getId(),
                config.getCode(),
                config.getName(),
                config.getIntegrationType(),
                config.getIntegrationType().getDisplayName(),
                config.getBaseUrl(),
                config.getApiKey() != null && !config.getApiKey().isEmpty(),
                config.getApiSecret() != null && !config.getApiSecret().isEmpty(),
                config.isActive(),
                config.getLastSyncAt(),
                config.getSyncStatus(),
                config.getSyncStatus().getDisplayName(),
                config.getConfigJson(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
