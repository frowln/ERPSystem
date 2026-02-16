package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportingFrequency {

    MONTHLY("Ежемесячно"),
    QUARTERLY("Ежеквартально"),
    ANNUAL("Ежегодно"),
    AD_HOC("Разово");

    private final String displayName;
}
