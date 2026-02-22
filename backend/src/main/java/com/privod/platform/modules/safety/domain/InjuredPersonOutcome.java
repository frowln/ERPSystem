package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InjuredPersonOutcome {

    RECOVERED("Выздоровление"),
    PERMANENT_DISABILITY("Стойкая нетрудоспособность"),
    FATAL("Смертельный исход");

    private final String displayName;
}
