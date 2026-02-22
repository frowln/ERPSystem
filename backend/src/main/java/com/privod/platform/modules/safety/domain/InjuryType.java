package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InjuryType {

    FRACTURE("Перелом"),
    CUT("Порез"),
    BRUISE("Ушиб"),
    BURN("Ожог"),
    ELECTRIC_SHOCK("Электротравма"),
    POISONING("Отравление"),
    FALL_FROM_HEIGHT("Падение с высоты"),
    CAUGHT_IN_MECHANISM("Затягивание в механизм"),
    STRUCK_BY_OBJECT("Удар предметом"),
    HEAT_STROKE("Тепловой удар"),
    OTHER("Прочее");

    private final String displayName;
}
