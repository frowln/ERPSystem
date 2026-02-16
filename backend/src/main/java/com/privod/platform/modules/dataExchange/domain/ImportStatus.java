package com.privod.platform.modules.dataExchange.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImportStatus {

    PENDING("Ожидает"),
    VALIDATING("Валидация"),
    VALIDATED("Проверен"),
    IMPORTING("Импорт"),
    COMPLETED("Завершён"),
    FAILED("Ошибка"),
    CANCELLED("Отменён");

    private final String displayName;
}
