package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkflowTriggerType {

    MANUAL("Ручной"),
    ON_CREATE("При создании"),
    ON_STATUS_CHANGE("При смене статуса"),
    ON_FIELD_CHANGE("При изменении поля"),
    SCHEDULED("По расписанию");

    private final String displayName;
}
