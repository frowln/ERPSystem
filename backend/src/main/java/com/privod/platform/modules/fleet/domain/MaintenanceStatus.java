package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaintenanceStatus {

    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    COMPLETED("Завершено"),
    CANCELLED("Отменено");

    private final String displayName;
}
