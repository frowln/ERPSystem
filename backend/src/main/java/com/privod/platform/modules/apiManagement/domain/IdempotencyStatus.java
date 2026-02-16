package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IdempotencyStatus {

    PROCESSING("В обработке"),
    COMPLETED("Завершено"),
    FAILED("Ошибка");

    private final String displayName;
}
