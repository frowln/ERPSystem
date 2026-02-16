package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TechnicalSolutionStatus {

    DRAFT("Черновик"),
    IN_REVIEW("На рассмотрении"),
    APPROVED("Утверждено"),
    REJECTED("Отклонено"),
    IMPLEMENTED("Реализовано");

    private final String displayName;

    public boolean canTransitionTo(TechnicalSolutionStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_REVIEW;
            case IN_REVIEW -> target == APPROVED || target == REJECTED;
            case APPROVED -> target == IMPLEMENTED;
            case REJECTED -> target == DRAFT;
            case IMPLEMENTED -> false;
        };
    }
}
