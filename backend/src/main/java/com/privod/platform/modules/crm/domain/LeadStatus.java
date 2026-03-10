package com.privod.platform.modules.crm.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeadStatus {

    NEW("Новый"),
    QUALIFIED("Квалификация"),
    PROPOSITION("Предложение"),
    NEGOTIATION("Переговоры"),
    WON("Выиграно"),
    LOST("Потеряно");

    private final String displayName;
}
