package com.privod.platform.modules.isup.web.dto;

import com.privod.platform.modules.isup.domain.IsupConfiguration;

import java.time.Instant;
import java.util.UUID;

public record IsupConfigurationResponse(
        UUID id,
        UUID organizationId,
        String apiUrl,
        String certificatePath,
        String organizationInn,
        String organizationKpp,
        boolean isActive,
        Instant lastSyncAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IsupConfigurationResponse fromEntity(IsupConfiguration entity) {
        return new IsupConfigurationResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getApiUrl(),
                entity.getCertificatePath(),
                entity.getOrganizationInn(),
                entity.getOrganizationKpp(),
                entity.isActive(),
                entity.getLastSyncAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
