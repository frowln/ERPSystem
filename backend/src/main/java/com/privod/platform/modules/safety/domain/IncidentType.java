package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IncidentType {

    INJURY("Травма"),
    NEAR_MISS("Предпосылка к инциденту"),
    PROPERTY_DAMAGE("Повреждение имущества"),
    ENVIRONMENTAL("Экологический инцидент"),
    FIRE("Пожар"),
    FALL("Падение"),
    ELECTRICAL("Электрический инцидент"),
    OTHER("Прочее");

    private final String displayName;
}
