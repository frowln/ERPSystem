package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HealthStatus {

    HEALTHY("Работает"),
    DEGRADED("Деградация"),
    DOWN("Недоступен");

    private final String displayName;
}
