package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportExecutionStatus {

    RUNNING("Выполняется"),
    COMPLETED("Завершён"),
    FAILED("Ошибка");

    private final String displayName;
}
