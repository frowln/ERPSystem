package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QualityImpact {

    NO_IMPACT("Без влияния"),
    IMPROVEMENT("Улучшение"),
    ACCEPTABLE_REDUCTION("Допустимое снижение");

    private final String displayName;
}
