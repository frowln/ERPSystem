package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActOsvidetelstvovanieStatus {

    DRAFT("Черновик"),
    SIGNED("Подписан"),
    APPROVED("Утверждён"),
    ARCHIVED("В архиве");

    private final String displayName;

    public boolean canTransitionTo(ActOsvidetelstvovanieStatus target) {
        return switch (this) {
            case DRAFT -> target == SIGNED;
            case SIGNED -> target == APPROVED;
            case APPROVED -> target == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
