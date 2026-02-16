package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvoiceStatus {

    DRAFT("Черновик"),
    SENT("Отправлен"),
    PARTIALLY_PAID("Частично оплачен"),
    PAID("Оплачен"),
    OVERDUE("Просрочен"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(InvoiceStatus target) {
        return switch (this) {
            case DRAFT -> target == SENT || target == CANCELLED;
            case SENT -> target == PARTIALLY_PAID || target == PAID || target == OVERDUE || target == CANCELLED;
            case PARTIALLY_PAID -> target == PAID || target == OVERDUE || target == CANCELLED;
            case OVERDUE -> target == PARTIALLY_PAID || target == PAID || target == CANCELLED;
            case PAID, CANCELLED -> false;
        };
    }
}
