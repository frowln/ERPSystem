package com.privod.platform.modules.dailylog.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WeatherCondition {

    CLEAR("Ясно"),
    CLOUDY("Облачно"),
    RAIN("Дождь"),
    SNOW("Снег"),
    FROST("Мороз"),
    WIND("Ветер"),
    STORM("Шторм");

    private final String displayName;
}
