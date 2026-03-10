package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PpeCondition {

    NEW("Новое"),
    GOOD("Хорошее"),
    WORN("Изношенное"),
    DAMAGED("Повреждённое"),
    DECOMMISSIONED("Списано");

    private final String displayName;
}
