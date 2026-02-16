package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InventoryCheckStatus {

    PLANNED("Запланирована"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершена"),
    CANCELLED("Отменена");

    private final String displayName;
}
