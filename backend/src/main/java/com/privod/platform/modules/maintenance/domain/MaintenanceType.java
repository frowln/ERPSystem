package com.privod.platform.modules.maintenance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaintenanceType {

    CORRECTIVE("Корректирующее"),
    PREVENTIVE("Профилактическое"),
    PREDICTIVE("Прогнозное");

    private final String displayName;
}
