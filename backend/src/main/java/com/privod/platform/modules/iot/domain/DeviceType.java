package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeviceType {
    TEMPERATURE("Температура"),
    HUMIDITY("Влажность"),
    VIBRATION("Вибрация"),
    NOISE("Шум"),
    DUST("Пыль"),
    CAMERA("Камера"),
    GPS_TRACKER("GPS-трекер"),
    CONCRETE_SENSOR("Датчик бетона");

    private final String displayName;
}
