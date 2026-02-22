package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalDecisionType {

    APPROVED("Согласовано"),
    REJECTED("Отклонено"),
    DELEGATED("Делегировано"),
    ESCALATED("Эскалировано");

    private final String displayName;
}
