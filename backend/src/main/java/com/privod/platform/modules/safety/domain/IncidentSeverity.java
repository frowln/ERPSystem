package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IncidentSeverity {

    MINOR("Незначительный"),
    MODERATE("Умеренный"),
    SERIOUS("Серьёзный"),
    CRITICAL("Критический"),
    FATAL("Смертельный");

    private final String displayName;
}
