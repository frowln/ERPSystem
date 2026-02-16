package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionType {

    DAILY("Ежедневный"),
    WEEKLY("Еженедельный"),
    MONTHLY("Ежемесячный"),
    ANNUAL("Годовой");

    private final String displayName;
}
