package com.privod.platform.modules.procurementExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DispatchOrderStatus {

    NEW("Новая"),
    CONFIRMED("Подтверждена"),
    DISPATCHED("Отправлена"),
    IN_TRANSIT("В пути"),
    DELIVERED("Доставлена"),
    CANCELLED("Отменена");

    private final String displayName;

    public boolean canTransitionTo(DispatchOrderStatus target) {
        return switch (this) {
            case NEW -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == DISPATCHED || target == CANCELLED;
            case DISPATCHED -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == DELIVERED || target == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
