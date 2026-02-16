package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AlertStatus {
    ACTIVE("Активное"),
    ACKNOWLEDGED("Подтверждено"),
    RESOLVED("Решено");

    private final String displayName;
}
