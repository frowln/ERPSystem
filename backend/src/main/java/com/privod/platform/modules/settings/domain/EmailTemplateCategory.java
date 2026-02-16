package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmailTemplateCategory {

    WORKFLOW("Рабочий процесс"),
    NOTIFICATION("Уведомления"),
    REPORT("Отчёты"),
    SYSTEM("Системные");

    private final String displayName;
}
