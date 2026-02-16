package com.privod.platform.modules.warehouse.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StockAlertSeverity {

    INFO("Информация"),
    WARNING("Предупреждение"),
    CRITICAL("Критическое");

    private final String displayName;
}
