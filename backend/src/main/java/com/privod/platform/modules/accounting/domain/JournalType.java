package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JournalType {

    BANK("Банковский"),
    CASH("Кассовый"),
    SALES("Продажи"),
    PURCHASE("Закупки"),
    GENERAL("Общий");

    private final String displayName;
}
