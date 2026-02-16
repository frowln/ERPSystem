package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionType {

    INCOMING("Входной контроль"),
    OPERATIONAL("Операционный контроль"),
    ACCEPTANCE("Приёмочный контроль"),
    HIDDEN_WORK("Скрытые работы"),
    LABORATORY("Лабораторный контроль");

    private final String displayName;
}
