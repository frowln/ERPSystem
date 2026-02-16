package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TargetType {

    ALL_USERS("Все пользователи"),
    ROLE("По роли"),
    PROJECT_TEAM("Команда проекта"),
    SPECIFIC_USERS("Конкретные пользователи");

    private final String displayName;
}
