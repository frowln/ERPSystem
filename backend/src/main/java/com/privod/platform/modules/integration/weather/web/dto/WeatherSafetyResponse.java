package com.privod.platform.modules.integration.weather.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WeatherSafetyResponse(
        UUID projectId,
        boolean isSafe,
        String overallAssessment,
        List<String> warnings,
        WeatherDataResponse currentWeather,
        Instant assessedAt
) {
}
