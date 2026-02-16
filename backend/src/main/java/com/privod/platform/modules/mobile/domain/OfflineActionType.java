package com.privod.platform.modules.mobile.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OfflineActionType {
    CREATE("Создание"),
    UPDATE("Обновление"),
    DELETE("Удаление");

    private final String displayName;
}
