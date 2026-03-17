package com.privod.platform.modules.document.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentCategory {

    CONTRACT("Договор"),
    APPENDIX("Приложение"),
    ESTIMATE("Смета"),
    LOCAL_ESTIMATE("ЛСР"),
    SPECIFICATION("Спецификация"),
    DRAWING("Чертёж"),
    DESIGN_DOC("Проектная документация"),
    PERMIT("Разрешение"),
    ACT("Акт"),
    INVOICE("Счёт"),
    COMMERCIAL_PROPOSAL("Коммерческое предложение"),
    PROTOCOL("Протокол"),
    CORRESPONDENCE("Корреспонденция"),
    CERTIFICATE("Сертификат"),
    SCHEDULE("График"),
    PHOTO("Фото"),
    REPORT("Отчёт"),
    TECHNICAL("Техническая документация"),
    OTHER("Прочее");

    private final String displayName;
}
