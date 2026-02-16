package com.privod.platform.modules.revenueRecognition.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PeriodStatus {

    OPEN("Открыт"),
    CALCULATED("Рассчитан"),
    REVIEWED("Проверен"),
    POSTED("Проведён"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(PeriodStatus target) {
        return switch (this) {
            case OPEN -> target == CALCULATED;
            case CALCULATED -> target == REVIEWED || target == OPEN;
            case REVIEWED -> target == POSTED || target == CALCULATED;
            case POSTED -> target == CLOSED;
            case CLOSED -> false;
        };
    }
}
