package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CorrectiveActionType {

    IMMEDIATE("Немедленное"),
    CORRECTIVE("Корректирующее"),
    PREVENTIVE("Предупредительное");

    private final String displayName;
}
