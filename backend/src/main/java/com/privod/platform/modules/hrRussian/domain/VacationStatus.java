package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VacationStatus {

    PLANNED("Запланирован"),
    APPROVED("Утверждён"),
    ACTIVE("Действует"),
    COMPLETED("Завершён"),
    CANCELLED("Отменён");

    private final String displayName;
}
