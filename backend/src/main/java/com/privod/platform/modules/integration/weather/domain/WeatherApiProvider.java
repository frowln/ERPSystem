package com.privod.platform.modules.integration.weather.domain;

public enum WeatherApiProvider {

    OPENWEATHERMAP("OpenWeatherMap"),
    WEATHERAPI("WeatherAPI"),
    YANDEX_WEATHER("Яндекс.Погода");

    private final String displayName;

    WeatherApiProvider(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
