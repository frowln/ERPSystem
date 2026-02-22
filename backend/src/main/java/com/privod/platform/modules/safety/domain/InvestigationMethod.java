package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvestigationMethod {

    FIVE_WHYS("5 Почему"),
    ISHIKAWA("Диаграмма Исикавы"),
    FAULT_TREE("Дерево отказов"),
    BOW_TIE("Bow-Tie"),
    SIMPLE("Простой анализ");

    private final String displayName;
}
