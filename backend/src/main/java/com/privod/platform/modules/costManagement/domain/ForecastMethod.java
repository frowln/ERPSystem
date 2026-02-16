package com.privod.platform.modules.costManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ForecastMethod {

    MANUAL("Ручной"),
    EARNED_VALUE("Освоенный объём"),
    TREND("Тренд"),
    REGRESSION("Регрессия");

    private final String displayName;
}
