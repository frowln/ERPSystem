package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkType {

    PREPARATION("Подготовительные работы"),
    EARTHWORK("Земляные работы"),
    FOUNDATION("Фундаментные работы"),
    STRUCTURE("Конструкции"),
    ROOFING("Кровельные работы"),
    MEP("Инженерные системы"),
    FINISHING("Отделочные работы"),
    LANDSCAPING("Благоустройство"),
    COMMISSIONING("Пусконаладка"),
    OTHER("Прочее");

    private final String displayName;
}
