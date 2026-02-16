package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BimModelType {

    ARCHITECTURAL("Архитектурная"),
    STRUCTURAL("Конструктивная"),
    MEP("Инженерные системы (MEP)"),
    COMBINED("Комбинированная");

    private final String displayName;
}
