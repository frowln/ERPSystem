package com.privod.platform.modules.changeManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChangeOrderType {

    ADDITION("Дополнительные работы"),
    DEDUCTION("Исключение работ"),
    SUBSTITUTION("Замена"),
    TIME_EXTENSION("Продление сроков"),
    MIXED("Комбинированный");

    private final String displayName;
}
