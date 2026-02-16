package com.privod.platform.modules.taxRisk.domain;

public enum MitigationStatus {

    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    COMPLETED("Выполнено"),
    CANCELLED("Отменено");

    private final String displayName;

    MitigationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
