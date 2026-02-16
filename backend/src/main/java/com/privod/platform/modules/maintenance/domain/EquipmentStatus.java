package com.privod.platform.modules.maintenance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EquipmentStatus {

    OPERATIONAL("В эксплуатации"),
    NEEDS_REPAIR("Требует ремонта"),
    OUT_OF_SERVICE("Не в эксплуатации"),
    DECOMMISSIONED("Списано");

    private final String displayName;
}
