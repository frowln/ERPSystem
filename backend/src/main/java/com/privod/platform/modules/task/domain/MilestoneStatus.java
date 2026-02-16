package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MilestoneStatus {

    PENDING("Ожидает"),
    COMPLETED("Завершён"),
    OVERDUE("Просрочен"),
    CANCELLED("Отменён");

    private final String displayName;
}
