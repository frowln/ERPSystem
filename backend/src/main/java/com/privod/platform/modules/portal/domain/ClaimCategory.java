package com.privod.platform.modules.portal.domain;

public enum ClaimCategory {
    STRUCTURAL("Конструктивные дефекты"),
    PLUMBING("Сантехника"),
    ELECTRICAL("Электрика"),
    HVAC("Отопление и вентиляция"),
    FINISHING("Отделочные работы"),
    EXTERIOR("Фасад и наружные работы"),
    ELEVATOR("Лифтовое оборудование"),
    FIRE_SAFETY("Пожарная безопасность"),
    OTHER("Прочее");

    private final String displayName;

    ClaimCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
