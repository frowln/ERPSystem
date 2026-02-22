package com.privod.platform.modules.portal.domain;

public enum MilestoneStatus {
    UPCOMING("Предстоящая"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершена"),
    DELAYED("С задержкой");

    private final String displayName;

    MilestoneStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
