package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentStatus {

    DRAFT("Черновик"),
    PENDING("Ожидает"),
    APPROVED("Утверждён"),
    PAID("Оплачен"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(PaymentStatus target) {
        return switch (this) {
            case DRAFT -> target == PENDING || target == CANCELLED;
            case PENDING -> target == APPROVED || target == CANCELLED;
            case APPROVED -> target == PAID || target == CANCELLED;
            case PAID, CANCELLED -> false;
        };
    }
}
