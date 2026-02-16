package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CheckType {

    INCOMING_MATERIAL("Входной контроль материалов"),
    INTERMEDIATE_WORK("Промежуточный контроль работ"),
    HIDDEN_WORK("Освидетельствование скрытых работ"),
    FINAL("Итоговый контроль"),
    LABORATORY("Лабораторный контроль");

    private final String displayName;
}
