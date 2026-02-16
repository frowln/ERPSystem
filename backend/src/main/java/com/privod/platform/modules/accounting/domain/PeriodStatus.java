package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PeriodStatus {

    OPEN("Открыт"),
    CLOSED("Закрыт");

    private final String displayName;
}
