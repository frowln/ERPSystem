package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AsBuiltStatus {

    DRAFT("Черновик"),
    SUBMITTED("Представлен"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён");

    private final String displayName;

    public boolean canTransitionTo(AsBuiltStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == ACCEPTED || target == REJECTED;
            case ACCEPTED -> false;
            case REJECTED -> target == DRAFT;
        };
    }
}
