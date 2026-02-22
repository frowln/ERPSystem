package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClashTestStatus {

    PENDING("Ожидание"),
    RUNNING("Выполняется"),
    COMPLETED("Завершён"),
    FAILED("Ошибка");

    private final String displayName;
}
