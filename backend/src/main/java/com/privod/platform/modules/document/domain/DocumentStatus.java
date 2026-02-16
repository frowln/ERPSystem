package com.privod.platform.modules.document.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentStatus {

    DRAFT("Черновик"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    ACTIVE("Действующий"),
    ARCHIVED("В архиве"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(DocumentStatus target) {
        return switch (this) {
            case DRAFT -> target == UNDER_REVIEW || target == CANCELLED;
            case UNDER_REVIEW -> target == APPROVED || target == DRAFT || target == CANCELLED;
            case APPROVED -> target == ACTIVE || target == ARCHIVED || target == CANCELLED;
            case ACTIVE -> target == ARCHIVED || target == CANCELLED;
            case ARCHIVED, CANCELLED -> false;
        };
    }
}
