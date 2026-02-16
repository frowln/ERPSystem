package com.privod.platform.modules.integration.weather.web.dto;

import com.privod.platform.modules.integration.weather.domain.WeatherData;

import java.time.Instant;
import java.util.UUID;

public record WeatherDataResponse(
        UUID id,
        UUID projectId,
        String locationName,
        Double latitude,
        Double longitude,
        Double temperature,
        Double feelsLike,
        Integer humidity,
        Double windSpeed,
        String windDirection,
        String weatherCondition,
        String weatherDescription,
        Double pressure,
        Integer visibility,
        boolean isSafeForWork,
        Instant fetchedAt
) {
    public static WeatherDataResponse fromEntity(WeatherData entity) {
        return new WeatherDataResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getLocationName(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getTemperature(),
                entity.getFeelsLike(),
                entity.getHumidity(),
                entity.getWindSpeed(),
                entity.getWindDirection(),
                entity.getWeatherCondition(),
                entity.getWeatherDescription(),
                entity.getPressure(),
                entity.getVisibility(),
                entity.isSafeForWork(),
                entity.getFetchedAt()
        );
    }
}
