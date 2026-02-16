package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EstimateStatus {

    DRAFT("Черновик"),
    IN_WORK("В работе"),
    APPROVED("Утверждена"),
    ACTIVE("Активна");

    private final String displayName;

    public boolean canTransitionTo(EstimateStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_WORK;
            case IN_WORK -> target == APPROVED || target == DRAFT;
            case APPROVED -> target == ACTIVE || target == DRAFT;
            case ACTIVE -> false;
        };
    }
}
