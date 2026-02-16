package com.privod.platform.modules.hr.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CertificateType {

    SAFETY_GENERAL("Общая безопасность"),
    SAFETY_HEIGHTS("Работа на высоте"),
    SAFETY_ELECTRICAL("Электробезопасность"),
    SAFETY_FIRE("Пожарная безопасность"),
    MEDICAL("Медицинский осмотр"),
    QUALIFICATION("Квалификация"),
    DRIVING_LICENSE("Водительское удостоверение"),
    WELDING("Сварка"),
    OTHER("Прочее");

    private final String displayName;
}
