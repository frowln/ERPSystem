package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AlertType {
    THRESHOLD_EXCEEDED("Превышение порога"),
    DEVICE_OFFLINE("Устройство офлайн"),
    LOW_BATTERY("Низкий заряд"),
    ANOMALY("Аномалия");

    private final String displayName;
}
