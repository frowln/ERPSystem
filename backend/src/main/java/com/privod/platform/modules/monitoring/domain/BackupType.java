package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BackupType {
    FULL("Полное"),
    INCREMENTAL("Инкрементальное"),
    DATABASE_ONLY("Только база данных");

    private final String displayName;
}
