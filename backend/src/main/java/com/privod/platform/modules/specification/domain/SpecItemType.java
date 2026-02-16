package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SpecItemType {

    MATERIAL("Материал"),
    EQUIPMENT("Оборудование"),
    WORK("Работа");

    private final String displayName;
}
