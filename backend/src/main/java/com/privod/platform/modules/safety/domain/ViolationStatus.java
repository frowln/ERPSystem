package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ViolationStatus {

    OPEN("Открыто"),
    IN_PROGRESS("В работе"),
    RESOLVED("Устранено"),
    OVERDUE("Просрочено");

    private final String displayName;
}
