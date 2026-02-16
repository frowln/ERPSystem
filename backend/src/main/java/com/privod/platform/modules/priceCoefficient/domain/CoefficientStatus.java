package com.privod.platform.modules.priceCoefficient.domain;

public enum CoefficientStatus {

    DRAFT("Черновик"),
    ACTIVE("Действующий"),
    EXPIRED("Истёк");

    private final String displayName;

    CoefficientStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(CoefficientStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == ACTIVE;
            case ACTIVE -> newStatus == EXPIRED;
            case EXPIRED -> false;
        };
    }
}
