package com.privod.platform.modules.design.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DesignVersionStatus {

    DRAFT("Черновик"),
    IN_REVIEW("На рассмотрении"),
    APPROVED("Утверждено"),
    SUPERSEDED("Замещено"),
    ARCHIVED("Архивировано");

    private final String displayName;

    public boolean canTransitionTo(DesignVersionStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_REVIEW || target == ARCHIVED;
            case IN_REVIEW -> target == APPROVED || target == DRAFT;
            case APPROVED -> target == SUPERSEDED || target == ARCHIVED;
            case SUPERSEDED, ARCHIVED -> false;
        };
    }
}
