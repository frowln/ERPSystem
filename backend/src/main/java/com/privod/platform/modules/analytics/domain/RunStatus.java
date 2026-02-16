package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RunStatus {

    SUCCESS("Успешно"),
    FAILED("Ошибка");

    private final String displayName;
}
