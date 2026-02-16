package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AbcCategory {

    A("Категория A (высокая стоимость)"),
    B("Категория B (средняя стоимость)"),
    C("Категория C (низкая стоимость)");

    private final String displayName;
}
