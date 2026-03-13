package com.privod.platform.modules.selfEmployed.domain;

public enum ActStatus {

    DRAFT("Черновик"),
    SIGNED("Подписан"),
    PAID("Оплачен"),
    CANCELLED("Отменён");

    private final String displayName;

    ActStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(ActStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == SIGNED || newStatus == CANCELLED;
            case SIGNED -> newStatus == PAID || newStatus == CANCELLED;
            case PAID -> false;
            case CANCELLED -> false;
        };
    }
}
