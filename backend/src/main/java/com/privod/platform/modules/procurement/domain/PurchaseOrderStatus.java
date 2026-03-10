package com.privod.platform.modules.procurement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PurchaseOrderStatus {

    DRAFT("Черновик"),
    PENDING_APPROVAL("На согласовании"),
    APPROVED("Согласован"),
    SENT_TO_SUPPLIER("Отправлен поставщику"),
    PARTIALLY_DELIVERED("Частично доставлен"),
    DELIVERED("Доставлен"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(PurchaseOrderStatus target) {
        return switch (this) {
            case DRAFT -> target == PENDING_APPROVAL || target == CANCELLED;
            case PENDING_APPROVAL -> target == APPROVED || target == DRAFT || target == CANCELLED;
            case APPROVED -> target == SENT_TO_SUPPLIER || target == CANCELLED;
            case SENT_TO_SUPPLIER -> target == PARTIALLY_DELIVERED || target == DELIVERED || target == CANCELLED;
            case PARTIALLY_DELIVERED -> target == DELIVERED || target == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
