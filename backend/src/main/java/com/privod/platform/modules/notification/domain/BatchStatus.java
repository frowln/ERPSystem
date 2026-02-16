package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BatchStatus {

    PENDING("Ожидает"),
    SENDING("Отправляется"),
    SENT("Отправлено"),
    FAILED("Ошибка");

    private final String displayName;
}
