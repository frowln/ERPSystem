package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SoutHazardClass {

    CLASS_1("Оптимальные", "1"),
    CLASS_2("Допустимые", "2"),
    CLASS_3_1("Вредные 3.1", "3.1"),
    CLASS_3_2("Вредные 3.2", "3.2"),
    CLASS_3_3("Вредные 3.3", "3.3"),
    CLASS_3_4("Вредные 3.4", "3.4"),
    CLASS_4("Опасные", "4");

    private final String displayName;
    private final String code;
}
