package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AggregationType {

    SUM("Сумма"),
    AVG("Среднее"),
    COUNT("Количество"),
    MIN("Минимум"),
    MAX("Максимум"),
    FORMULA("Формула");

    private final String displayName;
}
