package com.privod.platform.modules.planning.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SkillCategory {

    CONSTRUCTION("Строительство"),
    ELECTRICAL("Электромонтаж"),
    PLUMBING("Сантехника"),
    WELDING("Сварка"),
    HVAC("ОВиК"),
    FIRE_SAFETY("Пожарная безопасность"),
    MANAGEMENT("Управление"),
    SAFETY("Охрана труда"),
    BIM("BIM"),
    GEODETIC("Геодезия"),
    CRANE_OPERATION("Крановые работы"),
    SCAFFOLDING("Леса и подмости"),
    PAINTING("Малярные работы"),
    CONCRETE("Бетонные работы"),
    REINFORCEMENT("Армирование");

    private final String displayName;
}
