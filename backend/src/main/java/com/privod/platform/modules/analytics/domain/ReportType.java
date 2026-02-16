package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportType {

    PROJECT_STATUS("Статус проектов"),
    FINANCIAL_SUMMARY("Финансовая сводка"),
    SAFETY_METRICS("Метрики безопасности"),
    PROCUREMENT_ANALYSIS("Анализ закупок"),
    HR_SUMMARY("Сводка по персоналу"),
    CUSTOM("Пользовательский");

    private final String displayName;
}
