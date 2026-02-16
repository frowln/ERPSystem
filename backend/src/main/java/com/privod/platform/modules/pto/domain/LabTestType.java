package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LabTestType {

    STRENGTH("Прочность"),
    DENSITY("Плотность"),
    MOISTURE("Влажность"),
    COMPACTION("Уплотнение"),
    FROST_RESISTANCE("Морозостойкость"),
    WATER_RESISTANCE("Водонепроницаемость"),
    TENSILE("Растяжение"),
    CHEMICAL("Химический анализ"),
    OTHER("Другое");

    private final String displayName;
}
