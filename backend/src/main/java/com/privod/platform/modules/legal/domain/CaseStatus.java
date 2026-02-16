package com.privod.platform.modules.legal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CaseStatus {

    OPEN("Открыто"),
    IN_PROGRESS("В работе"),
    HEARING("Слушание"),
    SETTLEMENT("Урегулирование"),
    CLOSED("Закрыто"),
    WON("Выиграно"),
    LOST("Проиграно");

    private final String displayName;
}
