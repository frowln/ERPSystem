package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SettingCategory {

    GENERAL("Общие"),
    EMAIL("Электронная почта"),
    SECURITY("Безопасность"),
    INTEGRATION("Интеграции"),
    NOTIFICATION("Уведомления"),
    BACKUP("Резервное копирование");

    private final String displayName;
}
