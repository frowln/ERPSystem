package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ScheduleStatus {

    DRAFT("Черновик"),
    APPROVED("Утверждён"),
    ACTIVE("Активен"),
    COMPLETED("Завершён");

    private final String displayName;
}
