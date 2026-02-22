package com.privod.platform.modules.quality.domain;

public enum ChecklistItemResult {
    PENDING("Ожидает"),
    PASS("Соответствует"),
    FAIL("Не соответствует"),
    NA("Н/П");

    private final String displayName;

    ChecklistItemResult(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
