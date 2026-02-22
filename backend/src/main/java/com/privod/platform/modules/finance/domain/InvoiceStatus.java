package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvoiceStatus {

    NEW("Новый"),
    UNDER_REVIEW("На рассмотрении"),
    LINKED_TO_POSITION("Привязан к позиции"),
    ON_APPROVAL("На согласовании"),
    APPROVED("Согласован"),
    CLOSED("Закрыт"),
    REJECTED("Отклонён"),

    // Legacy statuses kept for backward compatibility.
    DRAFT("Черновик"),
    SENT("Отправлен"),
    PARTIALLY_PAID("Частично оплачен"),
    PAID("Оплачен"),
    OVERDUE("Просрочен"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(InvoiceStatus target) {
        return switch (this) {
            case NEW -> target == UNDER_REVIEW
                    || target == LINKED_TO_POSITION
                    || target == ON_APPROVAL
                    || target == REJECTED
                    || target == CLOSED;
            case UNDER_REVIEW -> target == LINKED_TO_POSITION
                    || target == ON_APPROVAL
                    || target == REJECTED;
            case LINKED_TO_POSITION -> target == ON_APPROVAL
                    || target == APPROVED
                    || target == REJECTED;
            case ON_APPROVAL -> target == APPROVED
                    || target == REJECTED;
            case APPROVED -> target == PARTIALLY_PAID
                    || target == PAID
                    || target == OVERDUE
                    || target == CLOSED;
            case PARTIALLY_PAID -> target == PAID
                    || target == OVERDUE
                    || target == CLOSED;
            case OVERDUE -> target == PARTIALLY_PAID
                    || target == PAID
                    || target == CLOSED;
            case PAID -> target == CLOSED;
            case REJECTED -> target == NEW;
            case DRAFT -> target == SENT
                    || target == CANCELLED
                    || target == NEW
                    || target == UNDER_REVIEW
                    || target == REJECTED;
            case SENT -> target == PARTIALLY_PAID
                    || target == PAID
                    || target == OVERDUE
                    || target == CANCELLED
                    || target == LINKED_TO_POSITION
                    || target == ON_APPROVAL
                    || target == APPROVED;
            case CANCELLED, CLOSED -> false;
        };
    }
}
