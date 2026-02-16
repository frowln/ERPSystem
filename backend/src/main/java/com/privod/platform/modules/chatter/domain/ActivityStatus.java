package com.privod.platform.modules.chatter.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityStatus {

    PLANNED("Запланировано"),
    IN_PROGRESS("В работе"),
    DONE("Завершено"),
    CANCELLED("Отменено");

    private final String displayName;
}
