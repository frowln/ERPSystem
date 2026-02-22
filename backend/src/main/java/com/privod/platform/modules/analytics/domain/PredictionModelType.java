package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PredictionModelType {

    DELAY("Задержка сроков"),
    COST_OVERRUN("Превышение бюджета"),
    QUALITY_RISK("Риск качества");

    private final String displayName;
}
