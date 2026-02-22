package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QualityGateStatus {

    NOT_STARTED("Не начат"),
    IN_PROGRESS("В процессе"),
    BLOCKED("Заблокирован"),
    PASSED("Пройден"),
    FAILED("Не пройден");

    private final String displayName;
}
