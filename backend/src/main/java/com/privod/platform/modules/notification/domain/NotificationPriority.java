package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationPriority {

    LOW("Низкий"),
    NORMAL("Обычный"),
    HIGH("Высокий"),
    URGENT("Срочный");

    private final String displayName;
}
