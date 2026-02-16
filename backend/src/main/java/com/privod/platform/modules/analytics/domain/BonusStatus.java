package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BonusStatus {

    DRAFT("Черновик"),
    CALCULATED("Рассчитано"),
    APPROVED("Утверждено"),
    PAID("Выплачено");

    private final String displayName;
}
