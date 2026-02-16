package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WarehouseLocationType {

    CENTRAL("Центральный склад"),
    PROJECT_SITE("Объектный склад"),
    TRANSIT("Транзитный склад"),
    PARTNER("Склад контрагента");

    private final String displayName;
}
