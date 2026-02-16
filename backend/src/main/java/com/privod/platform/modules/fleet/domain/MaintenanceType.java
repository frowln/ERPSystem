package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaintenanceType {

    SCHEDULED("Плановое ТО"),
    UNSCHEDULED("Внеплановое ТО"),
    REPAIR("Ремонт"),
    INSPECTION("Осмотр");

    private final String displayName;
}
