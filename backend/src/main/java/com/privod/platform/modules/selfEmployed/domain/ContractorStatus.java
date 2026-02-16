package com.privod.platform.modules.selfEmployed.domain;

public enum ContractorStatus {

    ACTIVE("Активен"),
    SUSPENDED("Приостановлен"),
    TERMINATED("Расторгнут");

    private final String displayName;

    ContractorStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
