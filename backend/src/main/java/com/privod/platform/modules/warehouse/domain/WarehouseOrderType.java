package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Тип складского ордера.
 */
@Getter
@RequiredArgsConstructor
public enum WarehouseOrderType {
    RECEIPT("Приходный ордер (М-4)"),
    ISSUE("Расходный ордер (М-11)"),
    INTERNAL_TRANSFER("Внутреннее перемещение"),
    RETURN("Возврат");

    private final String displayName;
}
