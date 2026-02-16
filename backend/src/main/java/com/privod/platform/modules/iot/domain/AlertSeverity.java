package com.privod.platform.modules.iot.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AlertSeverity {
    LOW("Низкая"),
    MEDIUM("Средняя"),
    HIGH("Высокая"),
    CRITICAL("Критическая");

    private final String displayName;
}
