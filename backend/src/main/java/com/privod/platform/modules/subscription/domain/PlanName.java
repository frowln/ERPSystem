package com.privod.platform.modules.subscription.domain;

public enum PlanName {
    FREE("Бесплатный"),
    PRO("Профессиональный"),
    ENTERPRISE("Корпоративный");

    private final String displayName;

    PlanName(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
