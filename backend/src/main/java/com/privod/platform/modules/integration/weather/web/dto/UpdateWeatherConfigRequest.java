package com.privod.platform.modules.integration.weather.web.dto;

import com.privod.platform.modules.integration.weather.domain.WeatherApiProvider;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateWeatherConfigRequest(
        @NotNull(message = "Провайдер API обязателен")
        WeatherApiProvider apiProvider,

        @Size(max = 500, message = "API-ключ не должен превышать 500 символов")
        String apiKey,

        @Size(max = 255, message = "Город по умолчанию не должен превышать 255 символов")
        String defaultCity,

        Double defaultLatitude,

        Double defaultLongitude,

        boolean enabled,

        @Min(value = 5, message = "Интервал обновления не может быть менее 5 минут")
        @Max(value = 1440, message = "Интервал обновления не может быть более 1440 минут")
        int refreshIntervalMinutes
) {
}
