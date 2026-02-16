package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkPermitStatus {

    DRAFT("Черновик"),
    ISSUED("Выдано"),
    ACTIVE("Действует"),
    SUSPENDED("Приостановлено"),
    CLOSED("Закрыто"),
    EXPIRED("Истекло");

    private final String displayName;

    public boolean canTransitionTo(WorkPermitStatus target) {
        return switch (this) {
            case DRAFT -> target == ISSUED;
            case ISSUED -> target == ACTIVE || target == CLOSED;
            case ACTIVE -> target == SUSPENDED || target == CLOSED || target == EXPIRED;
            case SUSPENDED -> target == ACTIVE || target == CLOSED;
            case CLOSED, EXPIRED -> false;
        };
    }
}
