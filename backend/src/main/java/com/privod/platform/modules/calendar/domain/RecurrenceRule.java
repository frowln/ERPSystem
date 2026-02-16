package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecurrenceRule {

    NONE("Без повторения"),
    DAILY("Ежедневно"),
    WEEKLY("Еженедельно"),
    BIWEEKLY("Раз в две недели"),
    MONTHLY("Ежемесячно"),
    YEARLY("Ежегодно");

    private final String displayName;
}
