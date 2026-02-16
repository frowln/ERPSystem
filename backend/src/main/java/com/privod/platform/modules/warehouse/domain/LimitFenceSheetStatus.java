package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LimitFenceSheetStatus {
    ACTIVE("Действует"),
    EXHAUSTED("Исчерпан"),
    CLOSED("Закрыт"),
    CANCELLED("Отменён");

    private final String displayName;
}
