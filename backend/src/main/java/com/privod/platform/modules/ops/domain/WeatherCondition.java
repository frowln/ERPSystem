package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WeatherCondition {

    SUNNY("Солнечно"),
    CLOUDY("Облачно"),
    RAIN("Дождь"),
    SNOW("Снег"),
    STORM("Шторм"),
    FOG("Туман"),
    WINDY("Ветрено");

    private final String displayName;
}
