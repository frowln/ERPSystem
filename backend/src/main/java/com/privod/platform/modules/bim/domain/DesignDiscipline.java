package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DesignDiscipline {

    ARCHITECTURAL("Архитектура"),
    STRUCTURAL("Конструкции"),
    MEP("ОВК"),
    ELECTRICAL("Электрика"),
    PLUMBING("ВК"),
    HVAC("ОВИК"),
    FIRE("Пожарная безопасность"),
    CIVIL("Генплан"),
    LANDSCAPE("Ландшафт"),
    OTHER("Прочее");

    private final String displayName;
}
