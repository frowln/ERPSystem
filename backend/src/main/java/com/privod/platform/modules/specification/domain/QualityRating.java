package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QualityRating {

    BETTER("Лучше"),
    EQUAL("Равноценно"),
    LOWER("Ниже");

    private final String displayName;
}
