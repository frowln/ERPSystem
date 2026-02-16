package com.privod.platform.modules.m29.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum M29Status {

    DRAFT("Черновик"),
    CONFIRMED("Подтверждён"),
    VERIFIED("Проверен"),
    APPROVED("Утверждён"),
    POSTED("Проведён");

    private final String displayName;

    public boolean canTransitionTo(M29Status target) {
        return switch (this) {
            case DRAFT -> target == CONFIRMED;
            case CONFIRMED -> target == VERIFIED || target == DRAFT;
            case VERIFIED -> target == APPROVED || target == CONFIRMED;
            case APPROVED -> target == POSTED;
            case POSTED -> false;
        };
    }
}
