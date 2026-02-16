package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReconciliationActStatus {
    DRAFT("Черновик"),
    SENT("Отправлен"),
    CONFIRMED("Подтверждён"),
    DISPUTED("Расхождения"),
    SIGNED("Подписан");

    private final String displayName;
}
