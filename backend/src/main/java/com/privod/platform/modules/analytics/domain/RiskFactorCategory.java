package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RiskFactorCategory {

    WEATHER("Погодные условия"),
    WORKFORCE("Трудовые ресурсы"),
    MATERIAL("Материалы"),
    SUBCONTRACTOR("Субподрядчики"),
    FINANCIAL("Финансы"),
    REGULATORY("Регуляторные требования");

    private final String displayName;
}
