package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SickLeaveStatus {

    OPEN("Открыт"),
    CLOSED("Закрыт"),
    CANCELLED("Аннулирован");

    private final String displayName;
}
