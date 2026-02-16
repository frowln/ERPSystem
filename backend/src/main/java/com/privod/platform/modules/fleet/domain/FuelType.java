package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FuelType {

    DIESEL("Дизель"),
    GASOLINE("Бензин"),
    ELECTRIC("Электрический"),
    HYBRID("Гибрид"),
    GAS("Газ");

    private final String displayName;
}
