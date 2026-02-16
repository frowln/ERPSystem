package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BusinessTripStatus {

    PLANNED("Запланирована"),
    APPROVED("Утверждена"),
    ACTIVE("Действует"),
    COMPLETED("Завершена"),
    CANCELLED("Отменена");

    private final String displayName;
}
