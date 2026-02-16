package com.privod.platform.modules.integration.telegram.domain;

public enum TelegramMessageStatus {
    PENDING("В ожидании"),
    SENT("Отправлено"),
    FAILED("Ошибка");

    private final String displayName;

    TelegramMessageStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
