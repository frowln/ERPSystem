package com.privod.platform.modules.contract.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractStatus {

    DRAFT("Черновик"),
    ON_APPROVAL("На согласовании"),
    LAWYER_APPROVED("Одобрен юристом"),
    MANAGEMENT_APPROVED("Одобрен руководством"),
    FINANCE_APPROVED("Одобрен финансами"),
    APPROVED("Согласован"),
    SIGNED("Подписан"),
    ACTIVE("Действующий"),
    CLOSED("Закрыт"),
    REJECTED("Отклонён"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(ContractStatus target) {
        return switch (this) {
            case DRAFT -> target == ON_APPROVAL || target == CANCELLED;
            case ON_APPROVAL -> target == LAWYER_APPROVED || target == MANAGEMENT_APPROVED
                    || target == FINANCE_APPROVED || target == APPROVED || target == REJECTED;
            case LAWYER_APPROVED -> target == MANAGEMENT_APPROVED || target == APPROVED || target == REJECTED;
            case MANAGEMENT_APPROVED -> target == FINANCE_APPROVED || target == APPROVED || target == REJECTED;
            case FINANCE_APPROVED -> target == APPROVED || target == REJECTED;
            case APPROVED -> target == SIGNED || target == CANCELLED;
            case SIGNED -> target == ACTIVE || target == CANCELLED;
            case ACTIVE -> target == CLOSED || target == CANCELLED;
            case CLOSED, REJECTED, CANCELLED -> false;
        };
    }
}
