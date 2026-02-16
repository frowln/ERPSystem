package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PrescriptionStatus {

    OPEN("Открыто"),
    IN_PROGRESS("В работе"),
    COMPLETED("Выполнено"),
    OVERDUE("Просрочено");

    private final String displayName;
}
