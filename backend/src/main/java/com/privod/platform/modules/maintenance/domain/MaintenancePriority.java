package com.privod.platform.modules.maintenance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaintenancePriority {

    LOW("Низкий"),
    NORMAL("Нормальный"),
    HIGH("Высокий"),
    URGENT("Срочный");

    private final String displayName;
}
