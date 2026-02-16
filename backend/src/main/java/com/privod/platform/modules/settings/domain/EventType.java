package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventType {

    TASK_ASSIGNED("Назначение задачи"),
    TASK_COMPLETED("Выполнение задачи"),
    CONTRACT_APPROVED("Согласование договора"),
    CONTRACT_REJECTED("Отклонение договора"),
    INCIDENT_REPORTED("Регистрация происшествия"),
    DOCUMENT_SHARED("Предоставление документа"),
    DAILY_DIGEST("Ежедневный дайджест"),
    INSPECTION_SCHEDULED("Запланированная проверка"),
    PAYMENT_RECEIVED("Получение платежа"),
    BUDGET_EXCEEDED("Превышение бюджета"),
    DEADLINE_APPROACHING("Приближение срока");

    private final String displayName;
}
