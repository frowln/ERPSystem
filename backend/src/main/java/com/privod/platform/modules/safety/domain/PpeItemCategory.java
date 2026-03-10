package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PpeItemCategory {

    HEAD("Защита головы"),
    EYES("Защита глаз"),
    HEARING("Защита слуха"),
    RESPIRATORY("Защита органов дыхания"),
    HANDS("Защита рук"),
    FEET("Защита ног"),
    BODY("Защита тела"),
    FALL_PROTECTION("Защита от падения"),
    HIGH_VISIBILITY("Сигнальная одежда"),
    OTHER("Прочее");

    private final String displayName;
}
