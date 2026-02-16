package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TimesheetPeriodStatus {

    OPEN("Открыт"),
    SUBMITTED("Отправлен"),
    APPROVED("Утверждён");

    private final String displayName;
}
