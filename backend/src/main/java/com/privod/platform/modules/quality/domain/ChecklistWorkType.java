package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChecklistWorkType {

    CONCRETING("Бетонирование"),
    STEEL_INSTALLATION("Монтаж металлоконструкций"),
    WELDING("Сварка"),
    WATERPROOFING("Гидроизоляция"),
    FINISHING("Отделочные работы"),
    EARTHWORKS("Земляные работы"),
    ROOFING("Кровельные работы"),
    PLUMBING("Сантехнические работы"),
    ELECTRICAL("Электромонтажные работы"),
    HVAC("ОВКВ"),
    FACADE("Фасадные работы"),
    LANDSCAPING("Благоустройство"),
    OTHER("Прочие");

    private final String displayName;
}
