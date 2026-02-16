package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExecutionStatus {

    PENDING("Ожидает"),
    RUNNING("Выполняется"),
    COMPLETED("Завершён"),
    FAILED("Ошибка"),
    SKIPPED("Пропущен");

    private final String displayName;
}
