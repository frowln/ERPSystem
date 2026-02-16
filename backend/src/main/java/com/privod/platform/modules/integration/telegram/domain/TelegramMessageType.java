package com.privod.platform.modules.integration.telegram.domain;

public enum TelegramMessageType {
    NOTIFICATION("Уведомление"),
    ALERT("Оповещение"),
    REPORT("Отчёт"),
    COMMAND_RESPONSE("Ответ на команду");

    private final String displayName;

    TelegramMessageType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
