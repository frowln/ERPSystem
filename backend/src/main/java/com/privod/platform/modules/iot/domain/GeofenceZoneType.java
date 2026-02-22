package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GeofenceZoneType {

    SITE("Строительная площадка"),
    RESTRICTED("Запретная зона"),
    STORAGE("Склад");

    private final String displayName;
}
