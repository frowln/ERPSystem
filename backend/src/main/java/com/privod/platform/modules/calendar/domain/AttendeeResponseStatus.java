package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttendeeResponseStatus {

    PENDING("Ожидание"),
    ACCEPTED("Принято"),
    DECLINED("Отклонено"),
    TENTATIVE("Под вопросом");

    private final String displayName;
}
