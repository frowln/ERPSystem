package com.privod.platform.modules.email.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmailLogStatus {

    QUEUED("В очереди"),
    SENT("Отправлено"),
    FAILED("Ошибка");

    private final String displayName;
}
