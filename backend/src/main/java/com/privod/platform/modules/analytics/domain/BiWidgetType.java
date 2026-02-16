package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BiWidgetType {

    CHART_BAR("Столбчатая диаграмма"),
    CHART_LINE("Линейная диаграмма"),
    CHART_PIE("Круговая диаграмма"),
    CHART_DONUT("Кольцевая диаграмма"),
    TABLE("Таблица"),
    KPI_CARD("Карточка KPI"),
    MAP("Карта"),
    GANTT("Диаграмма Ганта"),
    HEATMAP("Тепловая карта");

    private final String displayName;
}
