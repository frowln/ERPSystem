package com.privod.platform.modules.isup.domain;

public enum IsupVerificationType {

    APPROVED("Одобрено"),
    REJECTED("Отклонено"),
    NEEDS_REVISION("Требует доработки"),
    PENDING("На рассмотрении");

    private final String displayName;

    IsupVerificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
