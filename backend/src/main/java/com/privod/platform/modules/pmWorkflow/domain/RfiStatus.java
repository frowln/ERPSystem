package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RfiStatus {

    DRAFT("Черновик"),
    OPEN("Открыт"),
    ASSIGNED("Назначен"),
    ANSWERED("Отвечен"),
    CLOSED("Закрыт"),
    VOID("Аннулирован");

    private final String displayName;

    public boolean canTransitionTo(RfiStatus target) {
        return switch (this) {
            case DRAFT -> target == OPEN;
            case OPEN -> target == ASSIGNED || target == VOID;
            case ASSIGNED -> target == ANSWERED || target == VOID;
            case ANSWERED -> target == CLOSED || target == OPEN;
            case CLOSED -> false;
            case VOID -> false;
        };
    }
}
