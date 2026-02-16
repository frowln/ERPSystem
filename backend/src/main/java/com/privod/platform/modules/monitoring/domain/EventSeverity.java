package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventSeverity {
    INFO("Информация"),
    WARNING("Предупреждение"),
    ERROR("Ошибка"),
    CRITICAL("Критическая ошибка");

    private final String displayName;
}
