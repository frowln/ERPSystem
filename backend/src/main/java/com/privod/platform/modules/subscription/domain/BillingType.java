package com.privod.platform.modules.subscription.domain;

public enum BillingType {
    SUBSCRIPTION("Подписка"),
    UPGRADE("Повышение плана"),
    DOWNGRADE("Понижение плана"),
    ADDON("Дополнительная услуга"),
    REFUND("Возврат");

    private final String displayName;

    BillingType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
