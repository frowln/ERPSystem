package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IssueStatus {

    OPEN("Открыт"),
    IN_PROGRESS("В работе"),
    RESOLVED("Решён"),
    CLOSED("Закрыт"),
    REOPENED("Переоткрыт");

    private final String displayName;

    public boolean canTransitionTo(IssueStatus target) {
        return switch (this) {
            case OPEN -> target == IN_PROGRESS || target == CLOSED;
            case IN_PROGRESS -> target == RESOLVED || target == OPEN;
            case RESOLVED -> target == CLOSED || target == REOPENED;
            case CLOSED -> target == REOPENED;
            case REOPENED -> target == IN_PROGRESS || target == CLOSED;
        };
    }
}
