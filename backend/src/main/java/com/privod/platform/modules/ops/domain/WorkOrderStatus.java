package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkOrderStatus {

    DRAFT("Черновик"),
    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    ON_HOLD("Приостановлено"),
    COMPLETED("Завершено"),
    CANCELLED("Отменено");

    private final String displayName;

    public boolean canTransitionTo(WorkOrderStatus target) {
        return switch (this) {
            case DRAFT -> target == PLANNED || target == CANCELLED;
            case PLANNED -> target == IN_PROGRESS || target == CANCELLED;
            case IN_PROGRESS -> target == ON_HOLD || target == COMPLETED || target == CANCELLED;
            case ON_HOLD -> target == IN_PROGRESS || target == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
