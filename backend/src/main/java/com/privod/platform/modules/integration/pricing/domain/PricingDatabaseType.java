package com.privod.platform.modules.integration.pricing.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PricingDatabaseType {

    FER("ФЕР (Федеральные единичные расценки)"),
    TER("ТЕР (Территориальные единичные расценки)"),
    GESN("ГЭСН (Государственные элементные сметные нормы)"),
    LOCAL("Локальные расценки");

    private final String displayName;
}
