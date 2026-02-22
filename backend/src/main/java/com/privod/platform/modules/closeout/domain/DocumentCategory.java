package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentCategory {

    AOSR("АОСР"),
    QUALITY_PROTOCOL("Протоколы качества"),
    CERTIFICATE("Сертификаты"),
    COMMISSIONING("Пусконаладка"),
    PERMIT("Разрешения"),
    DRAWING("Чертежи"),
    AS_BUILT("Исполнительная документация"),
    GEODETIC("Геодезия"),
    JOURNAL("Журналы"),
    TEST_REPORT("Протоколы испытаний");

    private final String displayName;
}
