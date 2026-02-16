package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TrainingStatus {

    PLANNED("Запланирован"),
    IN_PROGRESS("Проводится"),
    COMPLETED("Завершён"),
    CANCELLED("Отменён");

    private final String displayName;
}
