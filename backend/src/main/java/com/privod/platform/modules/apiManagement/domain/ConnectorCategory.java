package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ConnectorCategory {

    ACCOUNTING("Бухгалтерия"),
    BIM("BIM"),
    COST_ESTIMATION("Сметы"),
    MESSAGING("Мессенджеры"),
    BANKING("Банкинг"),
    GOVERNMENT("Гос. реестры");

    private final String displayName;
}
