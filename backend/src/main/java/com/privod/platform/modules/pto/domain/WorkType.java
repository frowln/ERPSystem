package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkType {

    CONCRETE("Бетонные работы"),
    REINFORCEMENT("Арматурные работы"),
    FOUNDATION("Фундаментные работы"),
    WATERPROOFING("Гидроизоляция"),
    INSULATION("Теплоизоляция"),
    ELECTRICAL("Электромонтажные работы"),
    PLUMBING("Сантехнические работы"),
    VENTILATION("Вентиляция"),
    WELDING("Сварочные работы"),
    EARTHWORK("Земляные работы"),
    FINISHING("Отделочные работы"),
    ROOFING("Кровельные работы"),
    OTHER("Другое");

    private final String displayName;
}
