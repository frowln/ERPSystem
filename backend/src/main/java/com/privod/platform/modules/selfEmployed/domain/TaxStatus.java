package com.privod.platform.modules.selfEmployed.domain;

public enum TaxStatus {

    ACTIVE("Действующий"),
    REVOKED("Аннулирован");

    private final String displayName;

    TaxStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
