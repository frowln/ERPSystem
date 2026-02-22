package com.privod.platform.modules.isup.domain;

public enum IsupTransmissionType {

    PROGRESS("Ход строительства"),
    DOCUMENTS("Документация"),
    PHOTOS("Фотоматериалы"),
    SCHEDULE("Графики работ"),
    FINANCIAL("Финансовые данные");

    private final String displayName;

    IsupTransmissionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
