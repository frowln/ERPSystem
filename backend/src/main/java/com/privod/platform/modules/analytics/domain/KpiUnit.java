package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KpiUnit {

    PERCENT("Процент"),
    CURRENCY("Валюта"),
    COUNT("Количество"),
    DAYS("Дни"),
    HOURS("Часы");

    private final String displayName;
}
