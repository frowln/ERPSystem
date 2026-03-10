package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SoutStatus {

    PLANNED("Запланирована"),
    IN_PROGRESS("Проводится"),
    COMPLETED("Завершена"),
    EXPIRED("Просрочена");

    private final String displayName;
}
