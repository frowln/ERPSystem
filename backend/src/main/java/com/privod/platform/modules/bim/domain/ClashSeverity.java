package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClashSeverity {

    LOW("Низкая"),
    MEDIUM("Средняя"),
    HIGH("Высокая"),
    CRITICAL("Критическая");

    private final String displayName;
}
