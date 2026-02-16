package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WeatherCondition {

    CLEAR("Ясно"),
    CLOUDY("Облачно"),
    RAIN("Дождь"),
    SNOW("Снег"),
    FOG("Туман");

    private final String displayName;
}
