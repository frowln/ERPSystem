package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.FeatureFlag;

import java.time.Instant;
import java.util.UUID;

public record FeatureFlagResponse(
        UUID id,
        String key,
        String name,
        String description,
        boolean enabled,
        boolean organizationScoped,
        Integer rolloutPercentage,
        String targetUserIds,
        String targetOrganizationIds,
        String variants,
        Instant expiresAt,
        String metadata,
        Instant createdAt,
        Instant updatedAt
) {
    public static FeatureFlagResponse fromEntity(FeatureFlag flag) {
        return new FeatureFlagResponse(
                flag.getId(),
                flag.getKey(),
                flag.getName(),
                flag.getDescription(),
                flag.isEnabled(),
                flag.isOrganizationScoped(),
                flag.getRolloutPercentage(),
                flag.getTargetUserIds(),
                flag.getTargetOrganizationIds(),
                flag.getVariants(),
                flag.getExpiresAt(),
                flag.getMetadata(),
                flag.getCreatedAt(),
                flag.getUpdatedAt()
        );
    }
}
