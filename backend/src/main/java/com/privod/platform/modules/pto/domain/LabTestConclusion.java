package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LabTestConclusion {

    PASSED("Соответствует"),
    FAILED("Не соответствует"),
    CONDITIONAL("Условно годен"),
    PENDING("Ожидает результатов");

    private final String displayName;
}
