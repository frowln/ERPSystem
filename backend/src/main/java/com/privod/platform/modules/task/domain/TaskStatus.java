package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TaskStatus {

    BACKLOG("Бэклог"),
    TODO("К выполнению"),
    IN_PROGRESS("В работе"),
    IN_REVIEW("На проверке"),
    DONE("Выполнена"),
    CANCELLED("Отменена");

    private final String displayName;

    public boolean canTransitionTo(TaskStatus target) {
        return switch (this) {
            case BACKLOG -> target == TODO || target == IN_PROGRESS || target == CANCELLED;
            case TODO -> target == IN_PROGRESS || target == BACKLOG || target == CANCELLED;
            case IN_PROGRESS -> target == IN_REVIEW || target == DONE || target == TODO || target == CANCELLED;
            case IN_REVIEW -> target == DONE || target == IN_PROGRESS || target == CANCELLED;
            case DONE, CANCELLED -> false;
        };
    }
}
