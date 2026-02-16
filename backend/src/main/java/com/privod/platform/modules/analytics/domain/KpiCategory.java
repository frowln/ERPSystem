package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KpiCategory {

    PROJECT("Проекты"),
    FINANCIAL("Финансы"),
    SAFETY("Безопасность"),
    HR("Персонал"),
    WAREHOUSE("Склад"),
    QUALITY("Качество");

    private final String displayName;
}
