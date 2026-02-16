package com.privod.platform.modules.procurementExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PurchaseOrderStatus {

    DRAFT("Черновик"),
    SENT("Отправлен поставщику"),
    CONFIRMED("Подтверждён"),
    PARTIALLY_DELIVERED("Частично доставлен"),
    DELIVERED("Доставлен"),
    INVOICED("Оплачен"),
    CLOSED("Закрыт"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(PurchaseOrderStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == SENT || newStatus == CANCELLED;
            case SENT -> newStatus == CONFIRMED || newStatus == CANCELLED;
            case CONFIRMED -> newStatus == PARTIALLY_DELIVERED || newStatus == DELIVERED || newStatus == CANCELLED;
            case PARTIALLY_DELIVERED -> newStatus == DELIVERED || newStatus == CANCELLED;
            case DELIVERED -> newStatus == INVOICED || newStatus == CLOSED;
            case INVOICED -> newStatus == CLOSED;
            case CLOSED, CANCELLED -> false;
        };
    }
}
