package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Discipline {

    ARCHITECTURAL("Архитектурный"),
    STRUCTURAL("Конструктивный"),
    MEP("Инженерные сети"),
    ELECTRICAL("Электрика"),
    PLUMBING("Водоснабжение и канализация"),
    HVAC("Вентиляция и кондиционирование"),
    FIRE_SAFETY("Пожарная безопасность"),
    CIVIL("Генплан"),
    LANDSCAPE("Ландшафт");

    private final String displayName;
}
