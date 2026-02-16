package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CalendarType {

    STANDARD("Стандартный"),
    CUSTOM("Пользовательский");

    private final String displayName;
}
