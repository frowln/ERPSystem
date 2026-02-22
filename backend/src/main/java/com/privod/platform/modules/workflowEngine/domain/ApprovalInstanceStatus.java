package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalInstanceStatus {

    IN_PROGRESS("В процессе"),
    APPROVED("Согласовано"),
    REJECTED("Отклонено"),
    CANCELLED("Отменено"),
    ESCALATED("Эскалировано");

    private final String displayName;
}
