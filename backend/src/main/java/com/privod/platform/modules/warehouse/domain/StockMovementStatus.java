package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StockMovementStatus {

    DRAFT("Черновик"),
    CONFIRMED("Подтверждено"),
    DONE("Выполнено"),
    CANCELLED("Отменено");

    private final String displayName;

    public boolean canTransitionTo(StockMovementStatus target) {
        return switch (this) {
            case DRAFT -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == DONE || target == CANCELLED;
            case DONE -> target == CANCELLED;
            case CANCELLED -> false;
        };
    }
}
