package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecurrenceType {

    DAILY("Ежедневно"),
    WEEKLY("Еженедельно"),
    MONTHLY("Ежемесячно"),
    QUARTERLY("Ежеквартально"),
    YEARLY("Ежегодно");

    private final String displayName;
}
