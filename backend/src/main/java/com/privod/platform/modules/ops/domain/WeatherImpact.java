package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WeatherImpact {

    NONE("Нет влияния"),
    MINOR("Незначительное"),
    MODERATE("Умеренное"),
    SEVERE("Существенное"),
    WORK_STOPPED("Работа остановлена");

    private final String displayName;
}
