package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SyncStatus {

    IDLE("Ожидание"),
    SYNCING("Синхронизация"),
    ERROR("Ошибка");

    private final String displayName;
}
