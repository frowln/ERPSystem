package com.privod.platform.modules.selfEmployed.domain;

public enum SelfEmployedPaymentStatus {

    DRAFT("Черновик"),
    PENDING_RECEIPT("Ожидание чека"),
    RECEIPT_RECEIVED("Чек получен"),
    PAID("Выплачен"),
    CANCELLED("Отменён");

    private final String displayName;

    SelfEmployedPaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(SelfEmployedPaymentStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == PENDING_RECEIPT || newStatus == CANCELLED;
            case PENDING_RECEIPT -> newStatus == RECEIPT_RECEIVED || newStatus == CANCELLED;
            case RECEIPT_RECEIVED -> newStatus == PAID || newStatus == CANCELLED;
            case PAID -> false;
            case CANCELLED -> false;
        };
    }
}
