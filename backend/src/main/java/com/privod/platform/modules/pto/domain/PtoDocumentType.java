package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PtoDocumentType {

    EXECUTIVE("Исполнительная документация"),
    AS_BUILT("Исполнительная схема"),
    TEST_REPORT("Протокол испытаний"),
    CERTIFICATE("Сертификат"),
    HIDDEN_WORK_ACT("Акт скрытых работ"),
    WORK_JOURNAL("Журнал работ"),
    DESIGN("Проектная документация"),
    OTHER("Прочее");

    private final String displayName;
}
