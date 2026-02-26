package com.privod.platform.modules.subscription.domain;

public enum PaymentStatus {
    PENDING("Ожидает оплаты"),
    PAID("Оплачен"),
    OVERDUE("Просрочен"),
    CANCELLED("Отменён"),
    REFUNDED("Возвращён");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
