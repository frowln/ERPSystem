package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SzvEventType {

    ПРИЕМ("Приём на работу"),
    УВОЛЬНЕНИЕ("Увольнение"),
    ПЕРЕВОД("Перевод"),
    ПЕРЕИМЕНОВАНИЕ("Переименование организации");

    private final String displayName;
}
