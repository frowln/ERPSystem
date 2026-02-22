package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportChartType {

    NONE("Без графика"),
    BAR("Столбчатая"),
    LINE("Линейная"),
    PIE("Круговая"),
    AREA("Площадная"),
    STACKED_BAR("Столбчатая с накоплением");

    private final String displayName;
}
