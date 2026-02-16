package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GuaranteeStatus {

    ACTIVE("Действует"),
    EXPIRED("Истекла"),
    CLAIMED("Востребована"),
    RETURNED("Возвращена");

    private final String displayName;
}
