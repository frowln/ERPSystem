package com.privod.platform.modules.isup.domain;

public enum IsupTransmissionStatus {

    PENDING("Ожидание"),
    SENDING("Отправка"),
    SENT("Отправлено"),
    CONFIRMED("Подтверждено"),
    REJECTED("Отклонено"),
    ERROR("Ошибка");

    private final String displayName;

    IsupTransmissionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
