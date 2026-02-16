package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChecklistStatus {

    NOT_STARTED("Не начат"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершён"),
    FAILED("Не пройден"),
    NA("Не применимо");

    private final String displayName;
}
