package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SyncDirection {

    IMPORT("Импорт"),
    EXPORT("Экспорт"),
    BIDIRECTIONAL("Двунаправленная");

    private final String displayName;
}
