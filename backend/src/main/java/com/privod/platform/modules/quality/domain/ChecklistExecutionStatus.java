package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChecklistExecutionStatus {

    DRAFT("Черновик"),
    IN_PROGRESS("В работе"),
    COMPLETED("Завершён"),
    CANCELLED("Отменён");

    private final String displayName;
}
