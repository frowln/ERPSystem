package com.privod.platform.modules.project.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProjectStatus {

    DRAFT("Черновик"),
    PLANNING("Планирование"),
    IN_PROGRESS("В работе"),
    ON_HOLD("Приостановлен"),
    COMPLETED("Завершён"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(ProjectStatus target) {
        return switch (this) {
            case DRAFT -> target == PLANNING || target == CANCELLED;
            case PLANNING -> target == IN_PROGRESS || target == ON_HOLD || target == CANCELLED;
            case IN_PROGRESS -> target == ON_HOLD || target == COMPLETED || target == CANCELLED;
            case ON_HOLD -> target == IN_PROGRESS || target == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
