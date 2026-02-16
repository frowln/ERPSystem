package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SyncType {

    FULL("Полная"),
    INCREMENTAL("Инкрементальная"),
    MANUAL("Ручная");

    private final String displayName;
}
