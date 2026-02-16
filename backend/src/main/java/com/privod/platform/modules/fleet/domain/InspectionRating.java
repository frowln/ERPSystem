package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionRating {

    PASS("Пройден"),
    CONDITIONAL("Условно пройден"),
    FAIL("Не пройден");

    private final String displayName;
}
