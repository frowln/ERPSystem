package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BriefingType {

    INITIAL("Вводный"),
    PRIMARY("Первичный"),
    REPEAT("Повторный"),
    UNSCHEDULED("Внеплановый"),
    TARGET("Целевой");

    private final String displayName;
}
