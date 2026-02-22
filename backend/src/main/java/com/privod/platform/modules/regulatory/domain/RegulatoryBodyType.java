package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RegulatoryBodyType {

    GIT("ГИТ (Гос. инспекция труда)"),
    ROSTEKHNADZOR("Ростехнадзор"),
    STROYNADZOR("Стройнадзор"),
    MCHS("МЧС / Госпожнадзор"),
    ROSPOTREBNADZOR("Роспотребнадзор"),
    ENVIRONMENTAL("Экологический надзор"),
    OTHER("Прочее");

    private final String displayName;
}
