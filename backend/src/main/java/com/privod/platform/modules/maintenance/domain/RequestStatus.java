package com.privod.platform.modules.maintenance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RequestStatus {

    NEW("Новая"),
    IN_PROGRESS("В работе"),
    REPAIRED("Отремонтировано"),
    SCRAP("Списано");

    private final String displayName;

    public boolean canTransitionTo(RequestStatus target) {
        return switch (this) {
            case NEW -> target == IN_PROGRESS || target == SCRAP;
            case IN_PROGRESS -> target == REPAIRED || target == SCRAP;
            case REPAIRED, SCRAP -> false;
        };
    }
}
