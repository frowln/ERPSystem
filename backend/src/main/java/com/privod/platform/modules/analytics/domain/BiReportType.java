package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BiReportType {

    STANDARD("Стандартный"),
    CUSTOM("Пользовательский"),
    SCHEDULED("Запланированный"),
    AD_HOC("Разовый");

    private final String displayName;
}
