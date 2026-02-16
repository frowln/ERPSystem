package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccountType {

    ACTIVE("Активный"),
    PASSIVE("Пассивный"),
    ACTIVE_PASSIVE("Активно-пассивный");

    private final String displayName;
}
