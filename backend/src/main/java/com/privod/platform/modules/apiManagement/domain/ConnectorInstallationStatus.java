package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ConnectorInstallationStatus {

    INSTALLED("Установлен"),
    CONFIGURED("Настроен"),
    ACTIVE("Активен"),
    DISABLED("Отключён"),
    ERROR("Ошибка");

    private final String displayName;
}
