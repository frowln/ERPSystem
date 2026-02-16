package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnsOperationType {

    TAX_PAYMENT("Уплата налога"),
    PENALTY("Пеня"),
    FINE("Штраф"),
    REFUND("Возврат"),
    OFFSET("Зачёт"),
    ADJUSTMENT("Корректировка");

    private final String displayName;
}
