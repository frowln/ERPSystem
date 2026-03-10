package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BroadcastType {

    INFO("Информация"),
    WARNING("Предупреждение"),
    MAINTENANCE("Техническое обслуживание"),
    FEATURE("Новая функциональность");

    private final String displayName;
}
