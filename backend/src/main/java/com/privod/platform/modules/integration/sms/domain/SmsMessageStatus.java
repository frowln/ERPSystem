package com.privod.platform.modules.integration.sms.domain;

public enum SmsMessageStatus {

    PENDING("В очереди"),
    SENT("Отправлено"),
    DELIVERED("Доставлено"),
    FAILED("Ошибка");

    private final String displayName;

    SmsMessageStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
