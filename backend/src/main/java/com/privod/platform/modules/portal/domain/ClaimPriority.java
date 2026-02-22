package com.privod.platform.modules.portal.domain;

public enum ClaimPriority {
    LOW("Низкий", 14),
    MEDIUM("Средний", 7),
    HIGH("Высокий", 3),
    CRITICAL("Критический", 1);

    private final String displayName;
    private final int slaDays;

    ClaimPriority(String displayName, int slaDays) {
        this.displayName = displayName;
        this.slaDays = slaDays;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getSlaDays() {
        return slaDays;
    }
}
