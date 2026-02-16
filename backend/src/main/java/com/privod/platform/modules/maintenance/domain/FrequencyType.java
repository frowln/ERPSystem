package com.privod.platform.modules.maintenance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FrequencyType {

    DAYS("Дни"),
    WEEKS("Недели"),
    MONTHS("Месяцы"),
    YEARS("Годы");

    private final String displayName;
}
