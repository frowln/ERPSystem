package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventType {

    MEETING("Совещание"),
    DEADLINE("Дедлайн"),
    INSPECTION("Проверка"),
    DELIVERY("Поставка"),
    MILESTONE("Веха"),
    HOLIDAY("Праздник"),
    TRAINING("Обучение"),
    OTHER("Прочее");

    private final String displayName;
}
