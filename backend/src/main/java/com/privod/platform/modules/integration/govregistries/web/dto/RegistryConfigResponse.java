package com.privod.platform.modules.integration.govregistries.web.dto;

import com.privod.platform.modules.integration.govregistries.domain.RegistryConfig;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;

import java.time.Instant;
import java.util.UUID;

public record RegistryConfigResponse(
        UUID id,
        RegistryType registryType,
        String registryTypeDisplayName,
        String apiUrl,
        boolean hasApiKey,
        boolean enabled,
        Instant lastSyncAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static RegistryConfigResponse fromEntity(RegistryConfig entity) {
        return new RegistryConfigResponse(
                entity.getId(),
                entity.getRegistryType(),
                entity.getRegistryType().getDisplayName(),
                entity.getApiUrl(),
                entity.getApiKey() != null && !entity.getApiKey().isBlank(),
                entity.isEnabled(),
                entity.getLastSyncAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
