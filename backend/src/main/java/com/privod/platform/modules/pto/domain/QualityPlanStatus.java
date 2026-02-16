package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QualityPlanStatus {

    DRAFT("Черновик"),
    ACTIVE("Действует"),
    APPROVED("Утверждён"),
    ARCHIVED("В архиве");

    private final String displayName;

    public boolean canTransitionTo(QualityPlanStatus target) {
        return switch (this) {
            case DRAFT -> target == ACTIVE;
            case ACTIVE -> target == APPROVED || target == ARCHIVED;
            case APPROVED -> target == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
