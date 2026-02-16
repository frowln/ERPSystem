package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WarehouseOrderStatus {
    DRAFT("Черновик"),
    CONFIRMED("Проведён"),
    CANCELLED("Отменён");

    private final String displayName;
}
