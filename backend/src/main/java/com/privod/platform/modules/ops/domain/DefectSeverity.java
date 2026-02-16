package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DefectSeverity {

    LOW("Низкая"),
    MEDIUM("Средняя"),
    HIGH("Высокая"),
    CRITICAL("Критическая");

    private final String displayName;
}
