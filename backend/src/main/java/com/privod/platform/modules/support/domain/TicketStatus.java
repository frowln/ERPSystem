package com.privod.platform.modules.support.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TicketStatus {

    OPEN("Открыта"),
    ASSIGNED("Назначена"),
    IN_PROGRESS("В работе"),
    WAITING_RESPONSE("Ожидание ответа"),
    RESOLVED("Решена"),
    CLOSED("Закрыта");

    private final String displayName;
}
