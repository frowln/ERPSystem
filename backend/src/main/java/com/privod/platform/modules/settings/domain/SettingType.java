package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SettingType {

    STRING("Строка"),
    INTEGER("Целое число"),
    BOOLEAN("Логическое"),
    JSON("JSON"),
    SECRET("Секрет");

    private final String displayName;
}
