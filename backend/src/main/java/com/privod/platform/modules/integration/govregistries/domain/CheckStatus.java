package com.privod.platform.modules.integration.govregistries.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CheckStatus {

    VALID("Действителен"),
    INVALID("Недействителен"),
    NOT_FOUND("Не найден"),
    ERROR("Ошибка проверки");

    private final String displayName;
}
