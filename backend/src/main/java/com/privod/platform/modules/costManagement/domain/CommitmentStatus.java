package com.privod.platform.modules.costManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CommitmentStatus {

    DRAFT("Черновик"),
    ISSUED("Выдан"),
    APPROVED("Утверждён"),
    CLOSED("Закрыт"),
    VOID("Аннулирован");

    private final String displayName;

    public boolean canTransitionTo(CommitmentStatus target) {
        return switch (this) {
            case DRAFT -> target == ISSUED || target == VOID;
            case ISSUED -> target == APPROVED || target == VOID;
            case APPROVED -> target == CLOSED || target == VOID;
            case CLOSED, VOID -> false;
        };
    }
}
