package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ToleranceCheckStatus {

    PASS("Соответствует"),
    FAIL("Не соответствует"),
    NEEDS_RECHECK("Требует повторной проверки");

    private final String displayName;
}
