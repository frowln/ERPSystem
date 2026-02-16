package com.privod.platform.modules.scheduler.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JobStatus {

    RUNNING("Выполняется"),
    SUCCESS("Успешно"),
    FAILED("Ошибка"),
    TIMEOUT("Таймаут");

    private final String displayName;
}
