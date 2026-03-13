package com.privod.platform.modules.selfEmployed.domain;

public enum ContractType {

    GPC("ГПХ"),
    SERVICE("Оказание услуг"),
    SUBCONTRACT("Субподряд");

    private final String displayName;

    ContractType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
