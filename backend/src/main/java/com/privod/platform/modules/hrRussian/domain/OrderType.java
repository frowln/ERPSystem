package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrderType {

    ПРИЕМ("Приём на работу"),
    УВОЛЬНЕНИЕ("Увольнение"),
    ПЕРЕВОД("Перевод"),
    ОТПУСК("Отпуск"),
    КОМАНДИРОВКА("Командировка");

    private final String displayName;
}
