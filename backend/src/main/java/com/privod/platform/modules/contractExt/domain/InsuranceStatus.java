package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InsuranceStatus {

    ACTIVE("Действует"),
    EXPIRED("Истёк"),
    CLAIMED("Заявлено"),
    CANCELLED("Отменён");

    private final String displayName;
}
