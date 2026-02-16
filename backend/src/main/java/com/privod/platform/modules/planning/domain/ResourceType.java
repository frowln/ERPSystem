package com.privod.platform.modules.planning.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResourceType {

    LABOR("Трудовые ресурсы"),
    EQUIPMENT("Техника"),
    MATERIAL("Материалы");

    private final String displayName;
}
