package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Normative base code type for estimate positions.
 * Determines the pricing source and work category.
 */
@Getter
@RequiredArgsConstructor
public enum PositionType {

    GESN("ГЭСН"),
    FSBC("ФСБЦ"),
    TC("ТЦ"),
    GESNr("ГЭСНр"),
    FER("ФЕР"),
    TER("ТЕР"),
    MANUAL("Ручной ввод");

    private final String displayName;

    /**
     * Returns true if this position type represents a work item (not material/equipment).
     */
    public boolean isWork() {
        return this == GESN || this == GESNr || this == FER || this == TER;
    }

    /**
     * Returns true if this position type represents material or equipment pricing.
     */
    public boolean isMaterialOrEquipment() {
        return this == FSBC || this == TC;
    }
}
