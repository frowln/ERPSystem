package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WaybillStatus {
    DRAFT("Черновик"),
    ISSUED("Выдан"),
    IN_PROGRESS("В рейсе"),
    COMPLETED("Завершён"),
    CLOSED("Закрыт");

    private final String displayName;
}
