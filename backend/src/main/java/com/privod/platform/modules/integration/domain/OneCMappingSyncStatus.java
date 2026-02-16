package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OneCMappingSyncStatus {

    SYNCED("Синхронизирован"),
    PENDING("Ожидает"),
    CONFLICT("Конфликт"),
    ERROR("Ошибка");

    private final String displayName;
}
