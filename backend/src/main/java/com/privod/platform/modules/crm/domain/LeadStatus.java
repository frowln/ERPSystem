package com.privod.platform.modules.crm.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeadStatus {

    NEW("Новый"),
    QUALIFIED("Квалифицирован"),
    PROPOSITION("Предложение"),
    WON("Выигран"),
    LOST("Проигран");

    private final String displayName;
}
