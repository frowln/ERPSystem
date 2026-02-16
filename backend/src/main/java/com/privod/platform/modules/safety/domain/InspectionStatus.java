package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionStatus {

    PLANNED("Запланирована"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершена"),
    CANCELLED("Отменена");

    private final String displayName;
}
