package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DashboardType {

    PERSONAL("Персональная"),
    SHARED("Общая"),
    SYSTEM("Системная");

    private final String displayName;
}
