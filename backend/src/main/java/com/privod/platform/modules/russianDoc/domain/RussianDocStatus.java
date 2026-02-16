package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RussianDocStatus {

    DRAFT("Черновик"),
    CONFIRMED("Подтверждён"),
    POSTED("Проведён"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(RussianDocStatus target) {
        return switch (this) {
            case DRAFT -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == POSTED || target == DRAFT || target == CANCELLED;
            case POSTED -> target == CANCELLED;
            case CANCELLED -> false;
        };
    }
}
