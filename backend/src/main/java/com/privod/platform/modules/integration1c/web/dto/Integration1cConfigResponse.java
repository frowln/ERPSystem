package com.privod.platform.modules.integration1c.web.dto;

import com.privod.platform.modules.integration1c.domain.Integration1cConfig;

import java.time.Instant;
import java.util.UUID;

public record Integration1cConfigResponse(
        UUID id,
        UUID organizationId,
        String baseUrl,
        String username,
        String databaseName,
        boolean syncEnabled,
        Instant lastSyncAt,
        int syncIntervalMinutes,
        Instant createdAt,
        Instant updatedAt
) {
    public static Integration1cConfigResponse from(Integration1cConfig config) {
        return new Integration1cConfigResponse(
                config.getId(),
                config.getOrganizationId(),
                config.getBaseUrl(),
                config.getUsername(),
                config.getDatabaseName(),
                config.isSyncEnabled(),
                config.getLastSyncAt(),
                config.getSyncIntervalMinutes(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
