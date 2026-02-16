package com.privod.platform.modules.changeManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChangeEventStatus {

    IDENTIFIED("Выявлен"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED_FOR_PRICING("Утверждён для расценки"),
    PRICED("Расценён"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    VOID("Аннулирован");

    private final String displayName;

    public boolean canTransitionTo(ChangeEventStatus target) {
        return switch (this) {
            case IDENTIFIED -> target == UNDER_REVIEW || target == VOID;
            case UNDER_REVIEW -> target == APPROVED_FOR_PRICING || target == REJECTED || target == VOID;
            case APPROVED_FOR_PRICING -> target == PRICED || target == REJECTED || target == VOID;
            case PRICED -> target == APPROVED || target == REJECTED || target == VOID;
            case APPROVED, REJECTED, VOID -> false;
        };
    }
}
