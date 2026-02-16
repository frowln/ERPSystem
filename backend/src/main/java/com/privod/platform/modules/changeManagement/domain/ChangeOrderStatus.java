package com.privod.platform.modules.changeManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChangeOrderStatus {

    DRAFT("Черновик"),
    PENDING_APPROVAL("Ожидает утверждения"),
    APPROVED("Утверждён"),
    EXECUTED("Исполнен"),
    VOID("Аннулирован");

    private final String displayName;

    public boolean canTransitionTo(ChangeOrderStatus target) {
        return switch (this) {
            case DRAFT -> target == PENDING_APPROVAL || target == VOID;
            case PENDING_APPROVAL -> target == APPROVED || target == VOID;
            case APPROVED -> target == EXECUTED || target == VOID;
            case EXECUTED, VOID -> false;
        };
    }
}
