package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmittalStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлен"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    REVISED("Доработан");

    private final String displayName;

    public boolean canTransitionTo(SubmittalStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == APPROVED || target == REJECTED;
            case APPROVED -> false;
            case REJECTED -> target == REVISED;
            case REVISED -> target == SUBMITTED;
        };
    }
}
