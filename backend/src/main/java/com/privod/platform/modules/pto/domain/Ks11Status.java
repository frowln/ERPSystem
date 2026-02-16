package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Ks11Status {

    DRAFT("Черновик"),
    PENDING("Ожидает подписания"),
    SIGNED("Подписан"),
    REJECTED("Отклонён");

    private final String displayName;
}
