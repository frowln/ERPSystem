package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SignatureStatus {

    UNSIGNED("Не подписан"),
    PARTIALLY_SIGNED("Частично подписан"),
    FULLY_SIGNED("Полностью подписан");

    private final String displayName;
}
