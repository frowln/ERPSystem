package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HealthComponent {
    DATABASE("База данных"),
    REDIS("Redis"),
    STORAGE("Хранилище"),
    EMAIL("Почтовый сервис"),
    INTEGRATION_1C("Интеграция 1С"),
    INTEGRATION_BANK("Банковская интеграция"),
    INTEGRATION_EDO("Интеграция ЭДО");

    private final String displayName;
}
