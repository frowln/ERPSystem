package com.privod.platform.modules.taxRisk.domain;

public enum FactorCategory {

    COUNTERPARTY("Контрагент"),
    TRANSACTION("Транзакция"),
    DOCUMENT("Документ"),
    PRICING("Ценообразование"),
    STRUCTURE("Структура");

    private final String displayName;

    FactorCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
