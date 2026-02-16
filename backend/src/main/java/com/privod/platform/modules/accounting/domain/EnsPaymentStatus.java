package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnsPaymentStatus {

    DRAFT("Черновик"),
    CONFIRMED("Подтверждён"),
    RECONCILED("Сверен");

    private final String displayName;

    public boolean canTransitionTo(EnsPaymentStatus target) {
        return switch (this) {
            case DRAFT -> target == CONFIRMED;
            case CONFIRMED -> target == RECONCILED || target == DRAFT;
            case RECONCILED -> false;
        };
    }
}
