package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DayType {

    WORKING("Рабочий день"),
    WEEKEND("Выходной"),
    HOLIDAY("Праздник"),
    SHORT_DAY("Сокращённый день"),
    NON_WORKING("Нерабочий день");

    private final String displayName;
}
