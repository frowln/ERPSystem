package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IssuePriority {

    LOW("Низкий"),
    NORMAL("Обычный"),
    HIGH("Высокий"),
    CRITICAL("Критичный");

    private final String displayName;
}
