package com.privod.platform.modules.crm.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CrmActivityType {

    CALL("Звонок"),
    MEETING("Встреча"),
    EMAIL("Электронная почта"),
    PROPOSAL("Коммерческое предложение"),
    SITE_VISIT("Выезд на объект");

    private final String displayName;
}
