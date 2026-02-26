package com.privod.platform.modules.subscription.domain;

public enum SubscriptionStatus {
    ACTIVE("Активна"),
    TRIAL("Пробный период"),
    EXPIRED("Истекла"),
    CANCELLED("Отменена");

    private final String displayName;

    SubscriptionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
