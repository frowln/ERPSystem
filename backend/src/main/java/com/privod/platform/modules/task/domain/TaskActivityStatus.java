package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TaskActivityStatus {

    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    DONE("Выполнено"),
    CANCELLED("Отменено");

    private final String displayName;
}
