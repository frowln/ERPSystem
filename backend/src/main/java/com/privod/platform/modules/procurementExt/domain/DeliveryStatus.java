package com.privod.platform.modules.procurementExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeliveryStatus {

    PLANNED("Запланирована"),
    LOADING("Загрузка"),
    IN_TRANSIT("В пути"),
    DELIVERED("Доставлена"),
    CANCELLED("Отменена");

    private final String displayName;

    public boolean canTransitionTo(DeliveryStatus target) {
        return switch (this) {
            case PLANNED -> target == LOADING || target == CANCELLED;
            case LOADING -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == DELIVERED || target == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
