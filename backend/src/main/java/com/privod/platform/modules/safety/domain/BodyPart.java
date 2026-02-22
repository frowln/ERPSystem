package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BodyPart {

    HEAD("Голова"),
    EYES("Глаза"),
    NECK("Шея"),
    CHEST("Грудь"),
    BACK("Спина"),
    ABDOMEN("Живот"),
    LEFT_ARM("Левая рука"),
    RIGHT_ARM("Правая рука"),
    LEFT_HAND("Левая кисть"),
    RIGHT_HAND("Правая кисть"),
    LEFT_LEG("Левая нога"),
    RIGHT_LEG("Правая нога"),
    LEFT_FOOT("Левая стопа"),
    RIGHT_FOOT("Правая стопа"),
    MULTIPLE("Множественные"),
    OTHER("Прочее");

    private final String displayName;
}
