package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MailActivityStatus {

    PLANNED("Запланировано"),
    DONE("Завершено"),
    CANCELLED("Отменено"),
    OVERDUE("Просрочено");

    private final String displayName;
}
