package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AllocationType {

    DIRECT("Прямое"),
    PROPORTIONAL("Пропорциональное"),
    FIXED("Фиксированное");

    private final String displayName;
}
