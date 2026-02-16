package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OneCExchangeStatus {

    STARTED("Запущен"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершён"),
    FAILED("Ошибка");

    private final String displayName;

    public boolean canTransitionTo(OneCExchangeStatus target) {
        return switch (this) {
            case STARTED -> target == IN_PROGRESS || target == FAILED;
            case IN_PROGRESS -> target == COMPLETED || target == FAILED;
            case COMPLETED, FAILED -> false;
        };
    }
}
