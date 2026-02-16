package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NonConformanceStatus {

    OPEN("Открыто"),
    INVESTIGATING("Расследование"),
    CORRECTIVE_ACTION("Корректирующее действие"),
    VERIFIED("Проверено"),
    CLOSED("Закрыто");

    private final String displayName;
}
