package com.privod.platform.modules.dailylog.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EntryType {

    WORK_PERFORMED("Выполненные работы"),
    MATERIAL_RECEIVED("Полученные материалы"),
    EQUIPMENT_USED("Использованная техника"),
    PERSONNEL("Персонал"),
    VISITOR("Посетитель"),
    DELAY("Задержка"),
    INCIDENT_NOTE("Запись об инциденте");

    private final String displayName;
}
