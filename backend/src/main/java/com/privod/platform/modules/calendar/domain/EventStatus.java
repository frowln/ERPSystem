package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventStatus {

    SCHEDULED("Запланировано"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершено"),
    CANCELLED("Отменено");

    private final String displayName;
}
