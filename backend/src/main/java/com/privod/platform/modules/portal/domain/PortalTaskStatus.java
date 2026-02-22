package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalTaskStatus {
    PENDING("Ожидает"),
    IN_PROGRESS("В работе"),
    COMPLETED("Завершена"),
    CANCELLED("Отменена");

    private final String displayName;
}
