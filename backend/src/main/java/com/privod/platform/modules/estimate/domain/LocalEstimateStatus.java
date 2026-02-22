package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LocalEstimateStatus {

    DRAFT("Черновик"),
    CALCULATED("Рассчитана"),
    APPROVED("Утверждена"),
    ARCHIVED("В архиве");

    private final String displayName;
}
