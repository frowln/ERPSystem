package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SpecificationStatus {

    DRAFT("Черновик"),
    IN_REVIEW("На проверке"),
    APPROVED("Утверждена"),
    ACTIVE("Активна");

    private final String displayName;

    public boolean canTransitionTo(SpecificationStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_REVIEW;
            case IN_REVIEW -> target == APPROVED || target == DRAFT;
            case APPROVED -> target == ACTIVE || target == DRAFT;
            case ACTIVE -> false;
        };
    }
}
