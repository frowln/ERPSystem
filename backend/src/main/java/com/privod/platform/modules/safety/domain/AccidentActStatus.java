package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccidentActStatus {

    DRAFT("Черновик"),
    INVESTIGATION("Расследование"),
    REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    SENT_TO_AUTHORITIES("Направлен в ГИТ"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(AccidentActStatus target) {
        return switch (this) {
            case DRAFT -> target == INVESTIGATION;
            case INVESTIGATION -> target == REVIEW;
            case REVIEW -> target == APPROVED || target == INVESTIGATION;
            case APPROVED -> target == SENT_TO_AUTHORITIES || target == CLOSED;
            case SENT_TO_AUTHORITIES -> target == CLOSED;
            case CLOSED -> false;
        };
    }
}
