package com.privod.platform.modules.document.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccessLevel {

    VIEW("Просмотр"),
    EDIT("Редактирование"),
    FULL("Полный доступ");

    private final String displayName;
}
