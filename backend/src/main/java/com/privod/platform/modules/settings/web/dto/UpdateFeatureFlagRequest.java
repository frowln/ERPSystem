package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.Instant;

public record UpdateFeatureFlagRequest(
        Boolean enabled,
        @Min(value = 0, message = "Процент ролаута не может быть меньше 0")
        @Max(value = 100, message = "Процент ролаута не может быть больше 100")
        Integer rolloutPercentage,
        String targetUserIds,
        String targetOrganizationIds,
        String variants,
        Instant expiresAt,
        String metadata
) {
}
