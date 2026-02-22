package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GeofenceAlertType {

    ENTERED("Вход в зону"),
    EXITED("Выход из зоны"),
    EXCEEDED_SPEED("Превышение скорости");

    private final String displayName;
}
