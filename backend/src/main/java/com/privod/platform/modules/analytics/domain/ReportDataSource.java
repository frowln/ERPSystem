package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportDataSource {

    PROJECTS("Проекты", "Данные по проектам"),
    CONTRACTS("Договоры", "Данные по договорам"),
    INVOICES("Счета", "Данные по счетам"),
    PAYMENTS("Платежи", "Данные по платежам"),
    EMPLOYEES("Сотрудники", "Данные по сотрудникам"),
    MATERIALS("Материалы", "Данные по материалам"),
    DAILY_LOGS("Журнал работ", "Ежедневные журналы"),
    QUALITY_CHECKS("Проверки качества", "Данные проверок качества"),
    SAFETY_INCIDENTS("Инциденты ОТ", "Данные инцидентов охраны труда"),
    KS2_DOCUMENTS("Документы КС-2", "Данные по документам КС-2"),
    TASKS("Задачи", "Данные по задачам проекта"),
    PURCHASE_REQUESTS("Заявки на закупку", "Данные по заявкам на закупку");

    private final String displayName;
    private final String description;
}
