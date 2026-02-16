package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionResult {

    PASS("Пройдена"),
    VIOLATIONS("Выявлены нарушения"),
    SUSPENSION("Приостановка");

    private final String displayName;
}
