package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityDelayUnit {

    DAYS("Дни"),
    WEEKS("Недели"),
    MONTHS("Месяцы");

    private final String displayName;
}
