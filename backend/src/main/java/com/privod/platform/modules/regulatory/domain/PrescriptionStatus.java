package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PrescriptionStatus {

    OPEN("Открыто"),
    RECEIVED("Получено"),
    IN_PROGRESS("В работе"),
    RESPONSE_SUBMITTED("Ответ направлен"),
    COMPLETED("Выполнено"),
    CLOSED("Закрыто"),
    APPEALED("Обжаловано"),
    OVERDUE("Просрочено");

    private final String displayName;
}
