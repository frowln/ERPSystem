package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MappingDirection {

    IMPORT("Импорт"),
    EXPORT("Экспорт"),
    BOTH("Обе стороны");

    private final String displayName;
}
