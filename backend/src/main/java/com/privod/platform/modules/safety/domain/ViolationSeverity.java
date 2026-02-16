package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ViolationSeverity {

    LOW("Низкая"),
    MEDIUM("Средняя"),
    HIGH("Высокая"),
    CRITICAL("Критическая");

    private final String displayName;
}
