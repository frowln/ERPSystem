package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnsTaxType {

    VAT("НДС"),
    PROFIT_TAX("Налог на прибыль"),
    PROPERTY_TAX("Налог на имущество"),
    TRANSPORT_TAX("Транспортный налог"),
    PERSONAL_INCOME("НДФЛ"),
    INSURANCE("Страховые взносы"),
    OTHER("Прочее");

    private final String displayName;
}
