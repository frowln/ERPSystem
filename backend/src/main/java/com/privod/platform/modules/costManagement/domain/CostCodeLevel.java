package com.privod.platform.modules.costManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CostCodeLevel {

    LEVEL1("Уровень 1"),
    LEVEL2("Уровень 2"),
    LEVEL3("Уровень 3"),
    LEVEL4("Уровень 4");

    private final String displayName;
}
