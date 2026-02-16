package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CheckResult {

    PASS("Соответствует"),
    CONDITIONAL_PASS("Условно соответствует"),
    FAIL("Не соответствует"),
    PENDING("Ожидает проверки");

    private final String displayName;
}
