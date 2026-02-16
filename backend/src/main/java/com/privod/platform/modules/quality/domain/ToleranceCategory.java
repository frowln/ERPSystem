package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ToleranceCategory {

    DIMENSIONAL("Размерные допуски"),
    STRUCTURAL("Конструктивные допуски"),
    FINISHING("Отделочные допуски"),
    INSTALLATION("Монтажные допуски"),
    ELECTRICAL("Электрические допуски"),
    PLUMBING("Сантехнические допуски");

    private final String displayName;
}
