package com.privod.platform.modules.kep.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepSigningStatus {

    PENDING("Ожидает подписания"),
    SIGNED("Подписан"),
    REJECTED("Отклонён"),
    EXPIRED("Просрочен"),
    CANCELLED("Отменён");

    private final String displayName;
}
