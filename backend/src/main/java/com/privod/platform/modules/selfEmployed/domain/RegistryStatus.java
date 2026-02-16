package com.privod.platform.modules.selfEmployed.domain;

public enum RegistryStatus {

    DRAFT("Черновик"),
    GENERATED("Сформирован"),
    SUBMITTED("Отправлен"),
    APPROVED("Утверждён");

    private final String displayName;

    RegistryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(RegistryStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == GENERATED;
            case GENERATED -> newStatus == SUBMITTED || newStatus == DRAFT;
            case SUBMITTED -> newStatus == APPROVED;
            case APPROVED -> false;
        };
    }
}
