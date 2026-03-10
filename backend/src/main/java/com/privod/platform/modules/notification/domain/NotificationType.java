package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    INFO("Информация"),
    WARNING("Предупреждение"),
    ERROR("Ошибка"),
    SUCCESS("Успех"),
    TASK("Задача"),
    APPROVAL("Согласование"),
    SYSTEM("Системное"),
    TASK_ASSIGNED("Задача назначена"),
    TASK_STATUS_CHANGED("Статус задачи изменён"),
    COMMENT_ADDED("Комментарий добавлен"),
    DOCUMENT_UPLOADED("Документ загружен"),
    APPROVAL_REQUIRED("Требуется согласование"),
    BUDGET_THRESHOLD("Порог бюджета"),
    SAFETY_ALERT("Предупреждение безопасности"),
    MESSAGE("Сообщение"),
    CALL("Звонок");

    private final String displayName;
}
