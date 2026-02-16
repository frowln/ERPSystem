package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BackupStatus {
    PENDING("Ожидает"),
    IN_PROGRESS("Выполняется"),
    COMPLETED("Завершено"),
    FAILED("Ошибка");

    private final String displayName;
}
