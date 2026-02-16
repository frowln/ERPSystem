package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SystemEventType {
    STARTUP("Запуск"),
    SHUTDOWN("Остановка"),
    ERROR("Ошибка"),
    WARNING("Предупреждение"),
    DEPLOYMENT("Развёртывание"),
    MIGRATION("Миграция"),
    BACKUP_COMPLETED("Резервное копирование завершено"),
    BACKUP_FAILED("Ошибка резервного копирования");

    private final String displayName;
}
