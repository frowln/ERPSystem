package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaterialCategory {

    CONCRETE("Бетон и растворы"),
    METAL("Металлоизделия"),
    WOOD("Пиломатериалы"),
    INSULATION("Изоляция"),
    PIPES("Трубы и фитинги"),
    ELECTRICAL("Электрооборудование"),
    FINISHING("Отделочные материалы"),
    FASTENERS("Крепёж"),
    TOOLS("Инструменты"),
    OTHER("Прочее");

    private final String displayName;
}
