package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LocalEstimateStatus {

    DRAFT("Черновик"),
    CALCULATED("Рассчитана"),
    APPROVED("Утверждена"),
    ARCHIVED("В архиве");

    private final String displayName;

    public boolean canTransitionTo(LocalEstimateStatus target) {
        return switch (this) {
            case DRAFT -> target == CALCULATED || target == ARCHIVED;
            case CALCULATED -> target == APPROVED || target == DRAFT || target == ARCHIVED;
            case APPROVED -> target == ARCHIVED || target == CALCULATED;
            case ARCHIVED -> target == DRAFT;
        };
    }
}
