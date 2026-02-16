package com.privod.platform.modules.legal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CaseType {

    CLAIM("Претензия"),
    DISPUTE("Спор"),
    ARBITRATION("Арбитраж"),
    LAWSUIT("Судебный иск"),
    PRETRIAL("Досудебное урегулирование");

    private final String displayName;
}
