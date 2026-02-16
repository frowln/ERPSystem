package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TaskPriority {

    LOW("Низкий"),
    NORMAL("Нормальный"),
    HIGH("Высокий"),
    URGENT("Срочный"),
    CRITICAL("Критический");

    private final String displayName;
}
