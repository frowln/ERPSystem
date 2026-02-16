package com.privod.platform.modules.priceCoefficient.domain;

public enum CoefficientType {

    REGIONAL("Региональный"),
    SEASONAL("Сезонный"),
    INFLATION("Инфляционный"),
    MATERIAL("Материальный"),
    CUSTOM("Пользовательский");

    private final String displayName;

    CoefficientType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
