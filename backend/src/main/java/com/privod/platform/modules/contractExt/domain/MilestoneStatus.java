package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MilestoneStatus {

    PENDING("Ожидает"),
    COMPLETED("Выполнена"),
    OVERDUE("Просрочена");

    private final String displayName;
}
