package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportFrequency {

    MONTHLY("Ежемесячно"),
    QUARTERLY("Ежеквартально"),
    YEARLY("Ежегодно"),
    ON_DEMAND("По запросу");

    private final String displayName;
}
