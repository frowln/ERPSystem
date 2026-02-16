package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StockLimitType {

    BELOW_MIN("Ниже минимума"),
    ABOVE_MAX("Выше максимума"),
    REORDER_POINT("Точка перезаказа");

    private final String displayName;
}
