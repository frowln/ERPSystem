package com.privod.platform.modules.integration.webdav.web.dto;

import com.privod.platform.modules.integration.webdav.domain.WebDavConfig;

import java.time.Instant;
import java.util.UUID;

public record WebDavConfigResponse(
        UUID id,
        String serverUrl,
        String username,
        String basePath,
        boolean enabled,
        int maxFileSizeMb,
        UUID organizationId,
        boolean passwordConfigured,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WebDavConfigResponse fromEntity(WebDavConfig entity) {
        return new WebDavConfigResponse(
                entity.getId(),
                entity.getServerUrl(),
                entity.getUsername(),
                entity.getBasePath(),
                entity.isEnabled(),
                entity.getMaxFileSizeMb(),
                entity.getOrganizationId(),
                entity.getPassword() != null && !entity.getPassword().isBlank(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
