package com.privod.platform.modules.calendar.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventPriority {

    LOW("Низкий"),
    NORMAL("Обычный"),
    HIGH("Высокий");

    private final String displayName;
}
