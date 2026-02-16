package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkType {

    PREPARATION("Подготовительные работы"),
    EARTHWORK("Земляные работы"),
    FOUNDATION("Фундамент"),
    WALLS("Стены"),
    ROOFING("Кровля"),
    FINISHING("Отделочные работы"),
    ELECTRICAL("Электромонтаж"),
    PLUMBING("Сантехника"),
    HVAC("Вентиляция и кондиционирование"),
    OTHER("Другое");

    private final String displayName;
}
