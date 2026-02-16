package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RegulatoryInspectionType {

    PLANNED("Плановая"),
    UNPLANNED("Внеплановая"),
    FOLLOW_UP("Повторная");

    private final String displayName;
}
