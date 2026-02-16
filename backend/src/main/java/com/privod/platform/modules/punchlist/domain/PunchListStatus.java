package com.privod.platform.modules.punchlist.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PunchListStatus {

    OPEN("Открыт"),
    IN_PROGRESS("В работе"),
    COMPLETED("Завершён");

    private final String displayName;
}
