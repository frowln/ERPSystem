package com.privod.platform.modules.crm.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeadPriority {

    LOW("Низкий"),
    NORMAL("Обычный"),
    HIGH("Высокий");

    private final String displayName;
}
