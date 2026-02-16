package com.privod.platform.modules.monitoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HealthStatus {
    HEALTHY("Работает"),
    DEGRADED("Деградация"),
    DOWN("Не работает");

    private final String displayName;
}
