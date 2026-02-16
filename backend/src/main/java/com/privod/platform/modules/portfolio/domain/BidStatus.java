package com.privod.platform.modules.portfolio.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BidStatus {

    DRAFT("Черновик"),
    IN_PREPARATION("Готовится"),
    SUBMITTED("Подан"),
    UNDER_EVALUATION("Оценивается"),
    WON("Выигран"),
    LOST("Проигран"),
    NO_BID("Без участия");

    private final String displayName;
}
