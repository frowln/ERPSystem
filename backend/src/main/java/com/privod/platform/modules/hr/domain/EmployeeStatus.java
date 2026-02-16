package com.privod.platform.modules.hr.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmployeeStatus {

    ACTIVE("Активен"),
    ON_LEAVE("В отпуске"),
    TERMINATED("Уволен"),
    SUSPENDED("Отстранён");

    private final String displayName;
}
