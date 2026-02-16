package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SbisConfig;

import java.time.Instant;
import java.util.UUID;

public record SbisConfigResponse(
        UUID id,
        String name,
        String apiUrl,
        String login,
        String certificateThumbprint,
        String organizationInn,
        String organizationKpp,
        boolean isActive,
        boolean autoSend,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SbisConfigResponse fromEntity(SbisConfig entity) {
        return new SbisConfigResponse(
                entity.getId(),
                entity.getName(),
                entity.getApiUrl(),
                entity.getLogin(),
                entity.getCertificateThumbprint(),
                entity.getOrganizationInn(),
                entity.getOrganizationKpp(),
                entity.isActive(),
                entity.isAutoSend(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
