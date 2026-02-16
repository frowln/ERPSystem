package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepSignatureRequestStatus {

    PENDING("Ожидает подписания"),
    SIGNED("Подписан"),
    REJECTED("Отклонён");

    private final String displayName;
}
