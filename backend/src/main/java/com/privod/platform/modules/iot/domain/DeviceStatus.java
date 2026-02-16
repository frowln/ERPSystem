package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeviceStatus {
    ONLINE("В сети"),
    OFFLINE("Не в сети"),
    MAINTENANCE("Обслуживание"),
    DECOMMISSIONED("Списано");

    private final String displayName;
}
