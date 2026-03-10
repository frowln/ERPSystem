package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BroadcastPriority {

    LOW("Низкий"),
    NORMAL("Обычный"),
    HIGH("Высокий");

    private final String displayName;
}
