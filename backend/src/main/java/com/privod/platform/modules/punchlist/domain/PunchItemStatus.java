package com.privod.platform.modules.punchlist.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PunchItemStatus {

    OPEN("Открыто"),
    IN_PROGRESS("В работе"),
    FIXED("Исправлено"),
    VERIFIED("Проверено"),
    CLOSED("Закрыто");

    private final String displayName;
}
