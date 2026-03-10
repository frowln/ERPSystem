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
                flag.getCreatedAt(),
                flag.getUpdatedAt()
        );
    }
}
