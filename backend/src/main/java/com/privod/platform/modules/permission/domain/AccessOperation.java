package com.privod.platform.modules.permission.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccessOperation {

    READ("Чтение"),
    CREATE("Создание"),
    UPDATE("Обновление"),
    DELETE("Удаление");

    private final String displayName;
}
