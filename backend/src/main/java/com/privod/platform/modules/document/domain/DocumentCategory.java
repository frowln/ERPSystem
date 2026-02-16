package com.privod.platform.modules.document.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentCategory {

    CONTRACT("Договор"),
    ESTIMATE("Смета"),
    SPECIFICATION("Спецификация"),
    DRAWING("Чертёж"),
    PERMIT("Разрешение"),
    ACT("Акт"),
    INVOICE("Счёт"),
    PROTOCOL("Протокол"),
    CORRESPONDENCE("Корреспонденция"),
    PHOTO("Фото"),
    REPORT("Отчёт"),
    OTHER("Прочее");

    private final String displayName;
}
