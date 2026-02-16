package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NonConformanceSeverity {

    MINOR("Незначительное"),
    MAJOR("Значительное"),
    CRITICAL("Критическое");

    private final String displayName;
}
