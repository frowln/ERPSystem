package com.privod.platform.modules.permission.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionAuditAction {

    GRANT("Выдача прав"),
    REVOKE("Отзыв прав"),
    CREATE_GROUP("Создание группы"),
    UPDATE_GROUP("Обновление группы"),
    DELETE_GROUP("Удаление группы"),
    SET_MODEL_ACCESS("Настройка доступа к модели"),
    CREATE_RULE("Создание правила"),
    UPDATE_RULE("Обновление правила"),
    DELETE_RULE("Удаление правила"),
    SET_FIELD_ACCESS("Настройка доступа к полю"),
    BULK_ASSIGN("Массовое назначение"),
    BULK_REVOKE("Массовый отзыв");

    private final String displayName;
}
