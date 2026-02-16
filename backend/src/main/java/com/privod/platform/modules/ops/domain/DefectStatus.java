package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DefectStatus {

    OPEN("Открыт"),
    IN_PROGRESS("В работе"),
    FIXED("Исправлен"),
    VERIFIED("Проверен"),
    CLOSED("Закрыт"),
    REJECTED("Отклонён");

    private final String displayName;

    public boolean canTransitionTo(DefectStatus target) {
        return switch (this) {
            case OPEN -> target == IN_PROGRESS || target == REJECTED;
            case IN_PROGRESS -> target == FIXED || target == OPEN;
            case FIXED -> target == VERIFIED || target == IN_PROGRESS;
            case VERIFIED -> target == CLOSED;
            case CLOSED, REJECTED -> false;
        };
    }
}
