package com.privod.platform.modules.permission.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionGroupCategory {

    GENERAL("Общие"),
    PROJECTS("Проекты"),
    MANAGEMENT("Управление"),
    FINANCE("Финансы"),
    WAREHOUSE("Склад"),
    SAFETY("Безопасность"),
    HR("Персонал"),
    ADMINISTRATION("Администрирование");

    private final String displayName;
}
