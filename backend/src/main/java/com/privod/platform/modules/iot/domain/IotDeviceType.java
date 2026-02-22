package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IotDeviceType {

    GPS_TRACKER("GPS-трекер"),
    ENGINE_SENSOR("Датчик двигателя"),
    FUEL_SENSOR("Датчик топлива"),
    MULTI("Мультидатчик");

    private final String displayName;
}
