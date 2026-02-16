package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DispatchStatus {

    PLANNED("Запланировано"),
    DISPATCHED("Отправлено"),
    IN_TRANSIT("В пути"),
    DELIVERED("Доставлено"),
    CANCELLED("Отменено");

    private final String displayName;

    public boolean canTransitionTo(DispatchStatus target) {
        return switch (this) {
            case PLANNED -> target == DISPATCHED || target == CANCELLED;
            case DISPATCHED -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == DELIVERED || target == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
