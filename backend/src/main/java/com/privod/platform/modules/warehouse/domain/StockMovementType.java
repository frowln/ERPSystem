package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StockMovementType {

    RECEIPT("Приход"),
    ISSUE("Расход"),
    TRANSFER("Перемещение"),
    ADJUSTMENT("Корректировка"),
    RETURN("Возврат"),
    WRITE_OFF("Списание");

    private final String displayName;
}
