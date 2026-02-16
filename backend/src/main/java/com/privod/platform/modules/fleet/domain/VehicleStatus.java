package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VehicleStatus {

    AVAILABLE("Доступна"),
    IN_USE("В использовании"),
    MAINTENANCE("На ТО"),
    REPAIR("В ремонте"),
    DECOMMISSIONED("Списана");

    private final String displayName;
}
