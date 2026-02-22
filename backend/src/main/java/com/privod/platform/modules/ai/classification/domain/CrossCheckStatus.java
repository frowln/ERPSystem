package com.privod.platform.modules.ai.classification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CrossCheckStatus {

    PASSED("Пройдено"),
    FAILED("Не пройдено"),
    WARNING("Предупреждение"),
    SKIPPED("Пропущено");

    private final String displayName;
}
