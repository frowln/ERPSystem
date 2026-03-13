package com.privod.platform.modules.selfEmployed.domain;

public enum NpdStatus {

    ACTIVE("Действующий"),
    INACTIVE("Неактивный"),
    NOT_REGISTERED("Не зарегистрирован"),
    UNKNOWN("Неизвестно");

    private final String displayName;

    NpdStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
