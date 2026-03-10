package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationCategory {

    TASK_ASSIGNED("Назначение задачи"),
    TASK_COMPLETED("Завершение задачи"),
    COMMENT_ADDED("Новый комментарий"),
    MENTION("Упоминание"),
    DEADLINE_APPROACHING("Приближение срока"),
    BUDGET_ALERT("Бюджетное предупреждение"),
    SAFETY_ALERT("Предупреждение по безопасности"),
    DOCUMENT_UPLOADED("Загрузка документа"),
    SYSTEM("Системное уведомление");

    private final String displayName;
}
