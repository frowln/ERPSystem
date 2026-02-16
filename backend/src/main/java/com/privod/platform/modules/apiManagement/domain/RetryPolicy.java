package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RetryPolicy {

    NONE("Без повтора"),
    LINEAR("Линейный повтор"),
    EXPONENTIAL("Экспоненциальный повтор");

    private final String displayName;
}
