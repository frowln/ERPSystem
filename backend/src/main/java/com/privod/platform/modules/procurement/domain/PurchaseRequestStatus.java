package com.privod.platform.modules.procurement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PurchaseRequestStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлена"),
    IN_APPROVAL("На согласовании"),
    APPROVED("Согласована"),
    REJECTED("Отклонена"),
    ASSIGNED("Назначена"),
    ORDERED("Заказано"),
    DELIVERED("Доставлено"),
    CLOSED("Закрыта"),
    CANCELLED("Отменена");

    private final String displayName;

    public boolean canTransitionTo(PurchaseRequestStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED || target == CANCELLED;
            case SUBMITTED -> target == IN_APPROVAL || target == CANCELLED;
            case IN_APPROVAL -> target == APPROVED || target == REJECTED;
            case APPROVED -> target == ASSIGNED || target == CANCELLED;
            case REJECTED -> target == DRAFT;
            case ASSIGNED -> target == ORDERED || target == CANCELLED;
            case ORDERED -> target == DELIVERED || target == CANCELLED;
            case DELIVERED -> target == CLOSED;
            case CLOSED, CANCELLED -> false;
        };
    }
}
