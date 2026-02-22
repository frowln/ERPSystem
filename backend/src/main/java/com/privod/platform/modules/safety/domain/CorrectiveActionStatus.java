package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CorrectiveActionStatus {

    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    COMPLETED("Выполнено"),
    OVERDUE("Просрочено"),
    CANCELLED("Отменено");

    private final String displayName;
}
