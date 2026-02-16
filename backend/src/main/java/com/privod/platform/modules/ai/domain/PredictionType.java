package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PredictionType {
    COST("Стоимость"),
    DURATION("Длительность"),
    RISK("Риск"),
    RESOURCE("Ресурс");

    private final String displayName;
}
