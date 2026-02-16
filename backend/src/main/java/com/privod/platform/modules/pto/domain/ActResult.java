package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActResult {

    PASSED("Соответствует требованиям"),
    FAILED("Не соответствует требованиям"),
    CONDITIONAL("Условно соответствует");

    private final String displayName;
}
