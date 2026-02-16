package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BudgetStatus {

    DRAFT("Черновик"),
    APPROVED("Утверждён"),
    ACTIVE("Активный"),
    FROZEN("Заморожен"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(BudgetStatus target) {
        return switch (this) {
            case DRAFT -> target == APPROVED;
            case APPROVED -> target == ACTIVE || target == DRAFT;
            case ACTIVE -> target == FROZEN || target == CLOSED;
            case FROZEN -> target == ACTIVE || target == CLOSED;
            case CLOSED -> false;
        };
    }
}
