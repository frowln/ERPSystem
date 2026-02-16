package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WidgetType {

    KPI_CARD("Карточка KPI"),
    BAR_CHART("Столбчатая диаграмма"),
    LINE_CHART("Линейная диаграмма"),
    PIE_CHART("Круговая диаграмма"),
    TABLE("Таблица"),
    GANTT("Диаграмма Ганта"),
    KANBAN("Канбан"),
    MAP("Карта"),
    COUNTER("Счётчик"),
    PROGRESS("Прогресс");

    private final String displayName;
}
