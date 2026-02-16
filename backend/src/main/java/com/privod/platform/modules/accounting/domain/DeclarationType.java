package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeclarationType {

    VAT("НДС"),
    PROFIT("Налог на прибыль"),
    PROPERTY("Налог на имущество"),
    USN("УСН");

    private final String displayName;
}
