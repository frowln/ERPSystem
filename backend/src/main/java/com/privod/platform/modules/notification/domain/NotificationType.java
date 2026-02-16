package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    INFO("Информация"),
    WARNING("Предупреждение"),
    ERROR("Ошибка"),
    SUCCESS("Успех"),
    TASK("Задача"),
    APPROVAL("Согласование"),
    SYSTEM("Системное");

    private final String displayName;
}
