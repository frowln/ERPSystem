package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CalculationMethod {

    RIM("Ресурсно-индексный метод"),
    BASE_INDEX("Базисно-индексный метод"),
    BASIS_INDEX("Базисно-индексный метод (2001 база × индекс)");

    private final String displayName;
}
