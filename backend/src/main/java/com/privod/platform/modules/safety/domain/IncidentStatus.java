package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IncidentStatus {

    REPORTED("Зарегистрирован"),
    UNDER_INVESTIGATION("На расследовании"),
    CORRECTIVE_ACTION("Корректирующие действия"),
    RESOLVED("Разрешён"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(IncidentStatus target) {
        return switch (this) {
            case REPORTED -> target == UNDER_INVESTIGATION || target == CLOSED;
            case UNDER_INVESTIGATION -> target == CORRECTIVE_ACTION || target == RESOLVED;
            case CORRECTIVE_ACTION -> target == RESOLVED;
            case RESOLVED -> target == CLOSED;
            case CLOSED -> false;
        };
    }
}
