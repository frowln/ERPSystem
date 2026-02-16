package com.privod.platform.modules.integration.weather.web.dto;

import com.privod.platform.modules.integration.weather.domain.WeatherApiProvider;
import com.privod.platform.modules.integration.weather.domain.WeatherConfig;

import java.time.Instant;
import java.util.UUID;

public record WeatherConfigResponse(
        UUID id,
        WeatherApiProvider apiProvider,
        String apiProviderDisplayName,
        String defaultCity,
        Double defaultLatitude,
        Double defaultLongitude,
        boolean enabled,
        int refreshIntervalMinutes,
        boolean apiKeyConfigured,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WeatherConfigResponse fromEntity(WeatherConfig entity) {
        return new WeatherConfigResponse(
                entity.getId(),
                entity.getApiProvider(),
                entity.getApiProvider().getDisplayName(),
                entity.getDefaultCity(),
                entity.getDefaultLatitude(),
                entity.getDefaultLongitude(),
                entity.isEnabled(),
                entity.getRefreshIntervalMinutes(),
                entity.getApiKey() != null && !entity.getApiKey().isBlank(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
