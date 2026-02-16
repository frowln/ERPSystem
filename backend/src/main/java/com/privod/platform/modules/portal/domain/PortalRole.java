package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalRole {
    CUSTOMER("Заказчик"),
    CONTRACTOR("Подрядчик"),
    SUBCONTRACTOR("Субподрядчик"),
    SUPPLIER("Поставщик");

    private final String displayName;
}
