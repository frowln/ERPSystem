package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KpiTrend {

    UP("Рост"),
    DOWN("Снижение"),
    STABLE("Стабильно");

    private final String displayName;
}
