package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SyncJobStatus {

    PENDING("Ожидает"),
    RUNNING("Выполняется"),
    COMPLETED("Завершено"),
    FAILED("Ошибка"),
    CANCELLED("Отменено");

    private final String displayName;

    public boolean canTransitionTo(SyncJobStatus target) {
        return switch (this) {
            case PENDING -> target == RUNNING || target == CANCELLED;
            case RUNNING -> target == COMPLETED || target == FAILED || target == CANCELLED;
            case FAILED -> target == PENDING;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
