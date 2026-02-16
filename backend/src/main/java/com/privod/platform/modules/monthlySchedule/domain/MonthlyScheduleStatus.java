package com.privod.platform.modules.monthlySchedule.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MonthlyScheduleStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлен на утверждение"),
    APPROVED("Утверждён"),
    CLOSED("Закрыт");

    private final String displayName;
}
