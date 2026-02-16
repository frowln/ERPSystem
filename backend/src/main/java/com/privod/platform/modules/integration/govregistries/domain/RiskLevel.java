package com.privod.platform.modules.integration.govregistries.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RiskLevel {

    LOW("Низкий"),
    MEDIUM("Средний"),
    HIGH("Высокий");

    private final String displayName;
}
