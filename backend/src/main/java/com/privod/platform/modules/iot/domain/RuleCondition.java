package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RuleCondition {
    GT("Больше"),
    LT("Меньше"),
    EQ("Равно"),
    BETWEEN("Между");

    private final String displayName;
}
