package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DepreciationMethod {

    LINEAR("Линейный"),
    REDUCING_BALANCE("Уменьшаемого остатка"),
    SUM_OF_YEARS("Суммы чисел лет");

    private final String displayName;
}
