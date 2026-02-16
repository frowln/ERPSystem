package com.privod.platform.modules.mobile.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OfflineActionStatus {
    PENDING("Ожидание"),
    SYNCED("Синхронизировано"),
    CONFLICT("Конфликт");

    private final String displayName;
}
